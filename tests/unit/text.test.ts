import { describe, expect, it } from 'vitest';
import { layoutLines, measureLetterSpaced } from '../../src/lib/text';

const measure = (c: string) => c.length * 10; // each char is 10px wide

describe('measureLetterSpaced', () => {
  it('single-char width has no letter-spacing contribution', () => {
    expect(measureLetterSpaced('A', 5, measure)).toEqual({
      total: 10,
      widths: [10]
    });
  });

  it('empty string is zero', () => {
    expect(measureLetterSpaced('', 99, measure)).toEqual({ total: 0, widths: [] });
  });

  it('N chars with ls adds ls * (N-1)', () => {
    expect(measureLetterSpaced('ABCD', 3, measure)).toEqual({
      total: 10 * 4 + 3 * 3, // 40 + 9 = 49
      widths: [10, 10, 10, 10]
    });
  });

  it('handles astral characters by code-point iteration', () => {
    // '🎸' is two UTF-16 code units but one grapheme cluster
    const result = measureLetterSpaced('🎸A', 2, measure);
    expect(result.widths).toHaveLength(2);
  });

  it('negative letterSpacing reduces total', () => {
    expect(measureLetterSpaced('AB', -4, measure).total).toBe(10 + 10 - 4);
  });
});

describe('layoutLines', () => {
  it('single line starts at centerY', () => {
    expect(layoutLines({ fontSize: 100, lineCount: 1, centerY: 500 })).toEqual({
      lineHeight: 105,
      startY: 500
    });
  });

  it('multi-line centers around centerY', () => {
    // lineHeight = 105, 3 lines → span = 2 * 105 = 210 → startY = 500 - 105 = 395
    expect(layoutLines({ fontSize: 100, lineCount: 3, centerY: 500 })).toEqual({
      lineHeight: 105,
      startY: 395
    });
  });

  it('lineHeight is size * 1.05', () => {
    expect(layoutLines({ fontSize: 200, lineCount: 1, centerY: 0 }).lineHeight).toBe(210);
  });
});
