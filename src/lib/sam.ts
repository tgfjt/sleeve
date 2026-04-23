import type { MaskCandidate } from './mask';
import type { SamPoint } from './sam-inputs';

/**
 * Runtime-swappable segmentation backend. Production uses the
 * Transformers.js / SlimSAM implementation in `sam-transformers.ts`;
 * E2E tests inject a stub via `window.__SLEEVE_SAM_STUB__` so the
 * 80MB model download stays out of CI.
 */
export type SamBackend = {
  prepareImage(source: string | Blob): Promise<void>;
  segment(points: SamPoint[]): Promise<MaskCandidate[]>;
};

export type SamFactory = () => Promise<SamBackend>;

declare global {
  interface Window {
    __SLEEVE_SAM_STUB__?: SamFactory;
  }
}

export async function resolveSamBackend(productionFactory: SamFactory): Promise<SamBackend> {
  if (typeof window !== 'undefined' && window.__SLEEVE_SAM_STUB__) {
    return window.__SLEEVE_SAM_STUB__();
  }
  return productionFactory();
}
