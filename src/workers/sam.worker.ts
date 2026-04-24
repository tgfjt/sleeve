/// <reference lib="webworker" />
import { AutoProcessor, env, RawImage, SamModel } from '@huggingface/transformers';
import { buildSamInputs, type SamPoint } from '../lib/sam-inputs';

const MODEL_ID = 'Xenova/slimsam-77-uniform';

export type WorkerRequest =
  | { type: 'prepare'; bitmap: ImageBitmap }
  | { type: 'segment'; points: SamPoint[] };

export type WorkerResponse =
  | { type: 'prepared' }
  | {
      type: 'candidates';
      candidates: Array<{ bitmap: ImageBitmap; score: number; area: number }>;
    }
  | { type: 'error'; message: string };

type ProcessorWithPostProcess = {
  (
    image: RawImage,
    args: Record<string, unknown>
  ): Promise<{
    original_sizes: unknown;
    reshaped_input_sizes: unknown;
  }>;
  post_process_masks(
    predMasks: unknown,
    originalSizes: unknown,
    reshapedInputSizes: unknown
  ): Promise<{ dims: number[]; data: Uint8Array }[]>;
};

type ModelOutputs = {
  pred_masks: unknown;
  iou_scores: { data: Float32Array };
};

let model: Awaited<ReturnType<typeof SamModel.from_pretrained>> | null = null;
let processor: ProcessorWithPostProcess | null = null;
let rawImage: RawImage | null = null;

async function ensureModel(): Promise<void> {
  if (model && processor) return;
  env.allowLocalModels = false;
  const device: 'webgpu' | 'wasm' = 'gpu' in navigator ? 'webgpu' : 'wasm';
  try {
    model = await SamModel.from_pretrained(MODEL_ID, { dtype: 'fp16', device });
  } catch (err) {
    console.warn('[sam.worker] fp16/webgpu init failed, retrying defaults:', err);
    model = await SamModel.from_pretrained(MODEL_ID);
  }
  processor = (await AutoProcessor.from_pretrained(
    MODEL_ID
  )) as unknown as ProcessorWithPostProcess;
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
  maskBits: Uint8Array,
  W: number,
  H: number,
  offset: number
): { bitmap: ImageBitmap; area: number } {
  const oc = new OffscreenCanvas(W, H);
  const ctx = oc.getContext('2d');
  if (!ctx) throw new Error('2D context unavailable in worker');
  const imgData = ctx.createImageData(W, H);
  const perMask = W * H;
  let area = 0;
  for (let i = 0; i < perMask; i++) {
    const v = maskBits[offset + i] ? 255 : 0;
    imgData.data[i * 4 + 0] = 255;
    imgData.data[i * 4 + 1] = 255;
    imgData.data[i * 4 + 2] = 255;
    imgData.data[i * 4 + 3] = v;
    if (v) area++;
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
      await ensureModel();
      rawImage = bitmapToRawImage(req.bitmap);
      req.bitmap.close();
      post({ type: 'prepared' });
      return;
    }
    if (req.type === 'segment') {
      if (!model || !processor) throw new Error('model not ready');
      if (!rawImage) throw new Error('prepareImage must run first');

      const { input_points, input_labels } = buildSamInputs(req.points);
      const inputs = await processor(rawImage, { input_points, input_labels });
      const outputs = (await model(
        inputs as unknown as Parameters<typeof model>[0]
      )) as unknown as ModelOutputs;

      const masks = await processor.post_process_masks(
        outputs.pred_masks,
        (inputs as { original_sizes: unknown }).original_sizes,
        (inputs as { reshaped_input_sizes: unknown }).reshaped_input_sizes
      );

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
      post({ type: 'candidates', candidates }, transfer);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    post({ type: 'error', message });
  }
});
