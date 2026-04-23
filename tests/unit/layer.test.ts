import { describe, expect, it } from 'vitest';
import {
  createTextLayer,
  linkLayerToMask,
  unlinkLayersFromMask,
  type TextLayer
} from '../../src/lib/layer';

const image = { width: 1000, height: 800 };

describe('createTextLayer', () => {
  it('defaults size to round(naturalH * 0.28)', () => {
    const layer = createTextLayer({ id: 1, image });
    expect(layer.size).toBe(Math.round(800 * 0.28)); // 224
  });

  it('centers the layer in the image', () => {
    const layer = createTextLayer({ id: 7, image });
    expect(layer).toMatchObject({ x: 500, y: 400 });
  });

  it('uses reference defaults (Anton, #ff4d2e, opacity 1, maskMode none)', () => {
    const layer = createTextLayer({ id: 3, image });
    expect(layer).toMatchObject({
      id: 3,
      text: 'YOUR TEXT',
      font: 'Anton',
      color: '#ff4d2e',
      opacity: 1,
      blur: 0,
      letterSpacing: 0,
      maskId: null,
      maskMode: 'none'
    });
  });
});

describe('linkLayerToMask', () => {
  const base: TextLayer = createTextLayer({ id: 1, image });

  it('sets maskId and maskMode when mode is behind/infront', () => {
    expect(linkLayerToMask(base, { mode: 'behind', maskId: 42 })).toMatchObject({
      maskMode: 'behind',
      maskId: 42
    });
    expect(linkLayerToMask(base, { mode: 'infront', maskId: 7 })).toMatchObject({
      maskMode: 'infront',
      maskId: 7
    });
  });

  it('clears maskId when mode is none', () => {
    const linked = linkLayerToMask(base, { mode: 'behind', maskId: 9 });
    expect(linkLayerToMask(linked, { mode: 'none' })).toMatchObject({
      maskMode: 'none',
      maskId: null
    });
  });

  it('returns a new object (pure)', () => {
    const out = linkLayerToMask(base, { mode: 'behind', maskId: 1 });
    expect(out).not.toBe(base);
    expect(base.maskMode).toBe('none');
  });
});

describe('unlinkLayersFromMask', () => {
  it('resets maskId+maskMode on layers whose maskId matches', () => {
    const a = linkLayerToMask(createTextLayer({ id: 1, image }), { mode: 'behind', maskId: 5 });
    const b = linkLayerToMask(createTextLayer({ id: 2, image }), { mode: 'infront', maskId: 9 });
    const c = createTextLayer({ id: 3, image }); // already unlinked

    const result = unlinkLayersFromMask([a, b, c], 5);
    expect(result[0]).toMatchObject({ id: 1, maskId: null, maskMode: 'none' });
    expect(result[1]).toMatchObject({ id: 2, maskId: 9, maskMode: 'infront' });
    expect(result[2]).toMatchObject({ id: 3, maskId: null, maskMode: 'none' });
  });

  it('returns a new array (pure)', () => {
    const layers = [createTextLayer({ id: 1, image })];
    expect(unlinkLayersFromMask(layers, 999)).not.toBe(layers);
  });
});
