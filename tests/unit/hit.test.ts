import { describe, expect, it } from 'vitest';
import { hitTestLayer } from '../../src/lib/hit';

describe('hitTestLayer', () => {
  const center = { x: 100, y: 200 };
  const box = { width: 40, height: 60 };
  // Reference margin: +30 around the half-box

  it('hits exactly at the center', () => {
    expect(hitTestLayer({ x: 100, y: 200 }, center, box)).toBe(true);
  });

  it('hits within half-box + 30 margin', () => {
    // half box x = 20, + 30 → 50 margin
    expect(hitTestLayer({ x: 149, y: 200 }, center, box)).toBe(true);
    expect(hitTestLayer({ x: 100, y: 259 }, center, box)).toBe(true);
  });

  it('misses outside half-box + 30 margin', () => {
    expect(hitTestLayer({ x: 151, y: 200 }, center, box)).toBe(false);
    expect(hitTestLayer({ x: 100, y: 261 }, center, box)).toBe(false);
  });

  it('checks both axes simultaneously', () => {
    // inside x, outside y → miss
    expect(hitTestLayer({ x: 100, y: 500 }, center, box)).toBe(false);
  });
});
