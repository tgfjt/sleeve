export type MaskMode = 'none' | 'behind' | 'infront';

export type TextLayer = {
  id: number;
  text: string;
  font: string;
  size: number;
  color: string;
  x: number;
  y: number;
  opacity: number;
  blur: number;
  letterSpacing: number;
  maskId: number | null;
  maskMode: MaskMode;
};

export type ImageSize = { width: number; height: number };

export function createTextLayer(args: { id: number; image: ImageSize }): TextLayer {
  const { id, image } = args;
  return {
    id,
    text: 'YOUR TEXT',
    font: 'Anton',
    size: Math.round(image.height * 0.28),
    color: '#ff4d2e',
    x: image.width / 2,
    y: image.height / 2,
    opacity: 1,
    blur: 0,
    letterSpacing: 0,
    maskId: null,
    maskMode: 'none'
  };
}

export type MaskLink = { mode: 'none' } | { mode: 'behind' | 'infront'; maskId: number };

export function linkLayerToMask(layer: TextLayer, link: MaskLink): TextLayer {
  if (link.mode === 'none') {
    return { ...layer, maskMode: 'none', maskId: null };
  }
  return { ...layer, maskMode: link.mode, maskId: link.maskId };
}

export function unlinkLayersFromMask(layers: TextLayer[], deletedMaskId: number): TextLayer[] {
  return layers.map((layer) =>
    layer.maskId === deletedMaskId ? { ...layer, maskId: null, maskMode: 'none' } : layer
  );
}
