import { describe, expect, it } from 'vitest';
import { clientToNatural, naturalToRect } from '../../src/lib/coords';

describe('clientToNatural', () => {
  const rect = { left: 10, top: 20, width: 100, height: 200 };
  const natural = { width: 1000, height: 2000 };

  it('maps rect top-left to (0, 0)', () => {
    expect(clientToNatural({ x: 10, y: 20 }, rect, natural)).toEqual({ x: 0, y: 0 });
  });

  it('maps rect bottom-right to (naturalW, naturalH)', () => {
    expect(clientToNatural({ x: 110, y: 220 }, rect, natural)).toEqual({ x: 1000, y: 2000 });
  });

  it('maps center proportionally', () => {
    expect(clientToNatural({ x: 60, y: 120 }, rect, natural)).toEqual({ x: 500, y: 1000 });
  });
});

describe('naturalToRect', () => {
  const rect = { width: 100, height: 200 };
  const natural = { width: 1000, height: 2000 };

  it('origin maps to (0, 0)', () => {
    expect(naturalToRect({ x: 0, y: 0 }, natural, rect)).toEqual({ x: 0, y: 0 });
  });

  it('natural max maps to rect max', () => {
    expect(naturalToRect({ x: 1000, y: 2000 }, natural, rect)).toEqual({ x: 100, y: 200 });
  });

  it('is the inverse of clientToNatural within the same rect', () => {
    const fullRect = { left: 0, top: 0, width: 100, height: 200 };
    const n = clientToNatural({ x: 42, y: 77 }, fullRect, natural);
    const back = naturalToRect(n, natural, fullRect);
    expect(back.x).toBeCloseTo(42);
    expect(back.y).toBeCloseTo(77);
  });
});
