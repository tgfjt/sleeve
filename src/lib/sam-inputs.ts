export type SamPointLabel = 0 | 1; // 0 = negative (subtract), 1 = positive (add)

export type SamPoint = {
  x: number;
  y: number;
  label: SamPointLabel;
};

export type SamInputs = {
  input_points: number[][][][]; // [[[[x,y], ...]]]
  input_labels: SamPointLabel[][][]; // [[[label, ...]]]
};

export function buildSamInputs(points: SamPoint[]): SamInputs {
  if (points.length === 0) {
    throw new Error('buildSamInputs: at least one point is required');
  }
  return {
    input_points: [[points.map((p) => [p.x, p.y])]],
    input_labels: [[points.map((p) => p.label)]]
  };
}
