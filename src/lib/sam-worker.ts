import type { MaskCandidate } from './mask';
import type { SamBackend } from './sam';
import type { SamPoint } from './sam-inputs';
import type { WorkerRequest, WorkerResponse } from '../workers/sam.worker';

/**
 * Spawns the SAM pipeline in a dedicated Worker and proxies the
 * SamBackend interface over postMessage. Transfers the input image
 * and each candidate mask as ImageBitmap so the main thread isn't
 * blocked by copy or pixel iteration.
 */
export async function createWorkerSamBackend(): Promise<SamBackend> {
  const worker = new Worker(new URL('../workers/sam.worker.ts', import.meta.url), {
    type: 'module'
  });

  function request<T extends WorkerResponse['type']>(
    message: WorkerRequest,
    expected: T,
    transfer: Transferable[] = []
  ): Promise<Extract<WorkerResponse, { type: T }>> {
    return new Promise((resolve, reject) => {
      const onMessage = (event: MessageEvent<WorkerResponse>) => {
        if (event.data.type === 'error') {
          worker.removeEventListener('message', onMessage);
          reject(new Error(event.data.message));
        } else if (event.data.type === expected) {
          worker.removeEventListener('message', onMessage);
          resolve(event.data as Extract<WorkerResponse, { type: T }>);
        }
      };
      worker.addEventListener('message', onMessage);
      worker.postMessage(message, transfer);
    });
  }

  return {
    async prepareImage(source: string | Blob): Promise<void> {
      const blob = typeof source === 'string' ? await (await fetch(source)).blob() : source;
      const bitmap = await createImageBitmap(blob);
      await request({ type: 'prepare', bitmap }, 'prepared', [bitmap]);
    },

    async segment(points: SamPoint[]): Promise<MaskCandidate[]> {
      // structuredClone (and postMessage) can't clone Svelte 5 $state
      // proxies, so flatten to plain objects before crossing the boundary.
      const plain = points.map((p) => ({ x: p.x, y: p.y, label: p.label }));
      const res = await request({ type: 'segment', points: plain }, 'candidates');
      return res.candidates.map((c) => ({
        canvas: c.bitmap,
        score: c.score,
        area: c.area
      }));
    }
  };
}
