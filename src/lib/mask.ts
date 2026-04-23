export type MaskCandidate<C = HTMLCanvasElement> = {
  canvas: C;
  score: number;
  area: number;
};

export type SavedMask<C = HTMLCanvasElement> = {
  id: number;
  name: string;
  canvas: C;
  score: number;
};

export function sortCandidatesByArea<C>(candidates: MaskCandidate<C>[]): MaskCandidate<C>[] {
  return candidates.toSorted((a, b) => a.area - b.area);
}

export function defaultSelectedIdx(total: number, prev: number | null): number {
  if (total === 0) return -1;
  if (prev == null || prev < 0 || prev >= total) return total - 1;
  return prev;
}

export function outlineOffset(width: number, height: number): number {
  return Math.max(2, Math.round(Math.min(width, height) * 0.003));
}
