import { describe, expect, it } from 'vitest';
import { exportFilename } from '../../src/lib/export';

describe('exportFilename', () => {
  it('uses the sleeve_<timestamp>.png shape', () => {
    const fixed = new Date('2026-04-23T12:34:56Z');
    expect(exportFilename(fixed)).toBe(`sleeve_${fixed.getTime()}.png`);
  });

  it('changes when called at different times', () => {
    const a = exportFilename(new Date(1));
    const b = exportFilename(new Date(2));
    expect(a).not.toBe(b);
  });
});
