import { describe, expect, it } from 'vitest';
import { buildSamInputs, type SamPoint } from '../../src/lib/sam-inputs';

describe('buildSamInputs', () => {
  it('wraps a single point in the expected batch-shape', () => {
    const pts: SamPoint[] = [{ x: 100, y: 200, label: 1 }];
    expect(buildSamInputs(pts)).toEqual({
      input_points: [[[[100, 200]]]],
      input_labels: [[[1]]]
    });
  });

  it('batches multiple points (positive + negative) together', () => {
    const pts: SamPoint[] = [
      { x: 10, y: 20, label: 1 },
      { x: 30, y: 40, label: 0 }
    ];
    expect(buildSamInputs(pts)).toEqual({
      input_points: [[[[10, 20], [30, 40]]]],
      input_labels: [[[1, 0]]]
    });
  });

  it('preserves order of points', () => {
    const pts: SamPoint[] = [
      { x: 3, y: 3, label: 1 },
      { x: 1, y: 1, label: 1 },
      { x: 2, y: 2, label: 0 }
    ];
    const out = buildSamInputs(pts);
    expect(out.input_points[0][0]).toEqual([[3, 3], [1, 1], [2, 2]]);
    expect(out.input_labels[0][0]).toEqual([1, 1, 0]);
  });

  it('throws on empty input (SAM needs at least one point)', () => {
    expect(() => buildSamInputs([])).toThrow();
  });
});
