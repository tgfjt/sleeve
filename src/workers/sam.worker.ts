/// <reference lib="webworker" />
import {
  AutoModelForMaskGeneration,
  AutoProcessor,
  env,
  RawImage
} from '@huggingface/transformers';
import { logitToAlpha } from '../lib/mask';
import { buildSamInputs, type SamPoint } from '../lib/sam-inputs';

// EdgeTAM: same download size as SlimSAM-77 (~20MB fp16) with SAM2's decoder.
export const DEFAULT_MODEL_ID = 'onnx-community/EdgeTAM-ONNX';

export type WorkerRequest =
  | { type: 'prepare'; bitmap: ImageBitmap; modelId: string; dtype: 'fp16' | 'fp32' }
  | { type: 'segment'; points: SamPoint[] };

export type WorkerResponse =
  | { type: 'prepared'; timings: Record<string, number>; backend: string }
  | {
      type: 'candidates';
      candidates: Array<{ bitmap: ImageBitmap; score: number; area: number }>;
      timings: Record<string, number>;
    }
  | { type: 'error'; message: string };

type ProcessorWithPostProcess = {
  (
    image: RawImage,
    args: Record<string, unknown>
  ): Promise<{
    pixel_values: unknown;
    original_sizes: unknown;
    reshaped_input_sizes: unknown;
  }>;
  image_processor: {
    reshape_input_points(points: unknown, orig: unknown, reshaped: unknown): unknown;
    add_input_labels(labels: unknown, points: unknown): unknown;
  };
  post_process_masks(
    predMasks: unknown,
    originalSizes: unknown,
    reshapedInputSizes: unknown,
    options: { binarize: boolean }
  ): Promise<{ dims: number[]; data: Float32Array }[]>;
};

type ModelOutputs = {
  pred_masks: unknown;
  iou_scores: { data: Float32Array };
};

type MaskModel = {
  (inputs: Record<string, unknown>): Promise<ModelOutputs>;
  get_image_embeddings(inputs: { pixel_values: unknown }): Promise<Record<string, unknown>>;
};

let model: MaskModel | null = null;
let backend = '';
let processor: ProcessorWithPostProcess | null = null;
// Everything per-image is computed once in `prepare`: preprocessing
// (resize/normalize to 1024px), the vision encoder, and the size metadata
// needed to rescale click coordinates. Per click only the decoder runs.
let prepared: {
  embeddings: Record<string, unknown>;
  original_sizes: unknown;
  reshaped_input_sizes: unknown;
} | null = null;

async function ensureModel(modelId: string, dtype: 'fp16' | 'fp32'): Promise<void> {
  if (model && processor) return;
  env.allowLocalModels = false;
  const device: 'webgpu' | 'wasm' = 'gpu' in navigator ? 'webgpu' : 'wasm';
  try {
    model = (await AutoModelForMaskGeneration.from_pretrained(modelId, {
      dtype,
      device
    })) as unknown as MaskModel;
    backend = `${device} ${dtype}`;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    model = (await AutoModelForMaskGeneration.from_pretrained(modelId)) as unknown as MaskModel;
    backend = `fallback (${device} ${dtype} failed: ${message})`;
  }
  processor = (await AutoProcessor.from_pretrained(modelId)) as unknown as ProcessorWithPostProcess;
}

function bitmapToRawImage(bitmap: ImageBitmap): RawImage {
  const W = bitmap.width;
  const H = bitmap.height;
  const oc = new OffscreenCanvas(W, H);
  const ctx = oc.getContext('2d');
  if (!ctx) throw new Error('2D context unavailable in worker');
  ctx.drawImage(bitmap, 0, 0);
  const data = ctx.getImageData(0, 0, W, H);
  return new RawImage(new Uint8ClampedArray(data.data.buffer), W, H, 4);
}

function tensorToMaskBitmap(
  logits: Float32Array,
  W: number,
  H: number,
  offset: number
): { bitmap: ImageBitmap; area: number } {
  const oc = new OffscreenCanvas(W, H);
  const ctx = oc.getContext('2d');
  if (!ctx) throw new Error('2D context unavailable in worker');
  const imgData = ctx.createImageData(W, H);
  const px = imgData.data;
  px.fill(255);
  const perMask = W * H;
  let area = 0;
  for (let i = 0; i < perMask; i++) {
    const a = logitToAlpha(logits[offset + i]);
    px[i * 4 + 3] = a;
    if (a >= 128) area++;
  }
  ctx.putImageData(imgData, 0, 0);
  return { bitmap: oc.transferToImageBitmap(), area };
}

function post(message: WorkerResponse, transfer?: Transferable[]): void {
  (self as unknown as Worker).postMessage(message, transfer ?? []);
}

self.addEventListener('message', async (event: MessageEvent<WorkerRequest>) => {
  const req = event.data;
  try {
    if (req.type === 'prepare') {
      const t: Record<string, number> = {};
      t.model = performance.now();
      await ensureModel(req.modelId, req.dtype);
      t.model = Math.round(performance.now() - t.model);
      const rawImage = bitmapToRawImage(req.bitmap);
      req.bitmap.close();
      t.preprocess = performance.now();
      const { pixel_values, original_sizes, reshaped_input_sizes } = await processor!(rawImage, {});
      t.preprocess = Math.round(performance.now() - t.preprocess);
      t.encoder = performance.now();
      const embeddings = await model!.get_image_embeddings({ pixel_values });
      t.encoder = Math.round(performance.now() - t.encoder);
      prepared = { embeddings, original_sizes, reshaped_input_sizes };
      post({ type: 'prepared', timings: t, backend });
      return;
    }
    if (req.type === 'segment') {
      if (!model || !processor) throw new Error('model not ready');
      if (!prepared) throw new Error('prepareImage must run first');

      const t: Record<string, number> = {};
      const { input_points, input_labels } = buildSamInputs(req.points);
      const { embeddings, original_sizes, reshaped_input_sizes } = prepared;
      const ip = processor.image_processor;
      const points = ip.reshape_input_points(input_points, original_sizes, reshaped_input_sizes);
      const labels = ip.add_input_labels(input_labels, points);
      t.decoder = performance.now();
      const outputs = await model({ input_points: points, input_labels: labels, ...embeddings });
      t.decoder = Math.round(performance.now() - t.decoder);

      t.postprocess = performance.now();
      const masks = await processor.post_process_masks(
        outputs.pred_masks,
        original_sizes,
        reshaped_input_sizes,
        { binarize: false }
      );
      t.postprocess = Math.round(performance.now() - t.postprocess);
      t.bitmaps = performance.now();

      const scores = outputs.iou_scores.data;
      const maskTensor = masks[0];
      const dims = maskTensor.dims;
      const H = dims[dims.length - 2];
      const W = dims[dims.length - 1];
      const maskData = maskTensor.data;
      const perMask = H * W;
      const numMasks = scores.length;

      const candidates: Array<{ bitmap: ImageBitmap; score: number; area: number }> = [];
      const transfer: Transferable[] = [];
      for (let k = 0; k < numMasks; k++) {
        const { bitmap, area } = tensorToMaskBitmap(maskData, W, H, k * perMask);
        candidates.push({ bitmap, score: scores[k], area });
        transfer.push(bitmap);
      }
      t.bitmaps = Math.round(performance.now() - t.bitmaps);
      post({ type: 'candidates', candidates, timings: t }, transfer);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    post({ type: 'error', message });
  }
});
