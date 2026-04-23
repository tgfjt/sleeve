import { describe, expect, it } from 'vitest';
import {
  defaultSelectedIdx,
  outlineOffset,
  sortCandidatesByArea,
  type MaskCandidate
} from '../../src/lib/mask';

type Cand = MaskCandidate<null>;
const cand = (area: number, score: number): Cand => ({ area, score, canvas: null });

describe('sortCandidatesByArea', () => {
  it('sorts ascending by area (S, M, L)', () => {
    const unsorted: Cand[] = [cand(5000, 0.9), cand(1000, 0.8), cand(3000, 0.95)];
    expect(sortCandidatesByArea(unsorted).map((c) => c.area)).toEqual([1000, 3000, 5000]);
  });

  it('does not mutate the input', () => {
    const input: Cand[] = [cand(3, 0.1), cand(1, 0.9)];
    const snapshot = input.map((c) => c.area);
    sortCandidatesByArea(input);
    expect(input.map((c) => c.area)).toEqual(snapshot);
  });

  it('is stable on ties', () => {
    const a = cand(10, 0.1);
    const b = cand(10, 0.2);
    expect(sortCandidatesByArea([a, b])).toEqual([a, b]);
  });
});

describe('defaultSelectedIdx', () => {
  it('defaults to the largest (last) when prev is null', () => {
    expect(defaultSelectedIdx(3, null)).toBe(2);
  });

  it('defaults to largest when prev is out of range', () => {
    expect(defaultSelectedIdx(3, 5)).toBe(2);
  });

  it('preserves prev when in range', () => {
    expect(defaultSelectedIdx(3, 1)).toBe(1);
  });

  it('returns -1 when no candidates', () => {
    expect(defaultSelectedIdx(0, null)).toBe(-1);
  });
});

describe('outlineOffset', () => {
  it('matches reference formula max(2, round(min(W,H) * 0.003))', () => {
    expect(outlineOffset(1000, 2000)).toBe(3); // round(1000 * 0.003) = 3
    expect(outlineOffset(4000, 4000)).toBe(12);
  });

  it('floors at 2 for small images', () => {
    expect(outlineOffset(100, 100)).toBe(2); // round(0.3) = 0, floored to 2
    expect(outlineOffset(500, 800)).toBe(2); // round(1.5) = 2
  });
});
