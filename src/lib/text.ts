export type MeasureFn = (char: string) => number;

export type LetterSpacedMeasurement = {
  total: number;
  widths: number[];
};

export function measureLetterSpaced(
  text: string,
  letterSpacing: number,
  measure: MeasureFn
): LetterSpacedMeasurement {
  const chars = [...text];
  if (chars.length === 0) return { total: 0, widths: [] };
  const widths = chars.map(measure);
  const total = widths.reduce((a, b) => a + b, 0) + letterSpacing * (chars.length - 1);
  return { total, widths };
}

export type LineLayout = { lineHeight: number; startY: number };

export function layoutLines(args: {
  fontSize: number;
  lineCount: number;
  centerY: number;
}): LineLayout {
  const { fontSize, lineCount, centerY } = args;
  const lineHeight = fontSize * 1.05;
  const startY = centerY - ((lineCount - 1) * lineHeight) / 2;
  return { lineHeight, startY };
}
