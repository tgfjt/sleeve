import { AutoProcessor, env, RawImage, SamModel } from '@huggingface/transformers';
import type { MaskCandidate } from './mask';
import type { SamBackend } from './sam';
import { buildSamInputs, type SamPoint } from './sam-inputs';

const MODEL_ID = 'Xenova/slimsam-77-uniform';

function buildMaskBitmap(
  maskBits: Uint8Array | Uint8ClampedArray | Int8Array,
  W: number,
  H: number,
  offset: number
): { canvas: ImageBitmap; area: number } {
  const canvas = new OffscreenCanvas(W, H);
  const ctx = canvas.getContext('2d')!;
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
  return { canvas: canvas.transferToImageBitmap(), area };
}

export async function createTransformersSamBackend(): Promise<SamBackend> {
  env.allowLocalModels = false;
  // WebGPU if available, else WASM. Transformers.js picks the best path.
  const device: 'webgpu' | 'wasm' = 'gpu' in navigator ? 'webgpu' : 'wasm';

  let model: Awaited<ReturnType<typeof SamModel.from_pretrained>>;
  try {
    model = await SamModel.from_pretrained(MODEL_ID, { dtype: 'fp16', device });
  } catch (err) {
    console.warn('fp16/webgpu init failed, retrying defaults:', err);
    model = await SamModel.from_pretrained(MODEL_ID);
  }
  const processor = await AutoProcessor.from_pretrained(MODEL_ID);

  let rawImage: Awaited<ReturnType<typeof RawImage.fromURL>> | null = null;

  return {
    async prepareImage(source) {
      const url = typeof source === 'string' ? source : URL.createObjectURL(source);
      rawImage = await RawImage.fromURL(url);
    },

    async segment(points: SamPoint[]): Promise<MaskCandidate[]> {
      if (!rawImage) throw new Error('SAM: prepareImage must be called first');
      const { input_points, input_labels } = buildSamInputs(points);
      const inputs = await processor(rawImage, { input_points, input_labels });
      const outputs = await model(inputs);

      // post_process_masks is defined on SAM processors but not surfaced in the
      // union-typed @huggingface/transformers Processor type.
      const masks = await (
        processor as unknown as {
          post_process_masks(
            predMasks: unknown,
            originalSizes: unknown,
            reshapedInputSizes: unknown
          ): Promise<{ dims: number[]; data: Uint8Array }[]>;
        }
      ).post_process_masks(outputs.pred_masks, inputs.original_sizes, inputs.reshaped_input_sizes);

      const scores = outputs.iou_scores.data as Float32Array;
      const maskTensor = masks[0];
      const dims = maskTensor.dims as number[];
      const H = dims[dims.length - 2];
      const W = dims[dims.length - 1];
      const maskData = maskTensor.data as Uint8Array;
      const perMask = H * W;
      const numMasks = scores.length;

      const candidates: MaskCandidate[] = [];
      for (let k = 0; k < numMasks; k++) {
        const { canvas, area } = buildMaskBitmap(maskData, W, H, k * perMask);
        candidates.push({ canvas, score: scores[k], area });
      }
      return candidates;
    }
  };
}
