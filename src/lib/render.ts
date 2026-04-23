import type { TextLayer } from './layer';
import type { SavedMask } from './mask';
import { layoutLines, measureLetterSpaced } from './text';

export function renderTextLayer(ctx: CanvasRenderingContext2D, layer: TextLayer): void {
  ctx.save();
  ctx.globalAlpha = layer.opacity;
  if (layer.blur > 0) ctx.filter = `blur(${layer.blur}px)`;
  ctx.fillStyle = layer.color;
  ctx.font = `${layer.size}px "${layer.font}", sans-serif`;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';

  const lines = (layer.text || '').split('\n');
  const { lineHeight, startY } = layoutLines({
    fontSize: layer.size,
    lineCount: lines.length,
    centerY: layer.y
  });

  const ls = layer.letterSpacing || 0;
  lines.forEach((line, i) => {
    const y = startY + i * lineHeight;
    if (ls === 0) {
      ctx.fillText(line, layer.x, y);
      return;
    }
    const { total, widths } = measureLetterSpaced(line, ls, (c) => ctx.measureText(c).width);
    const chars = [...line];
    let cx = layer.x - total / 2;
    ctx.textAlign = 'left';
    for (let k = 0; k < chars.length; k++) {
      ctx.fillText(chars[k], cx, y);
      cx += widths[k] + ls;
    }
    ctx.textAlign = 'center';
  });

  ctx.restore();
}

export function drawSubjectForeground(
  dst: CanvasRenderingContext2D,
  image: CanvasImageSource,
  mask: SavedMask,
  W: number,
  H: number
): void {
  const fg = document.createElement('canvas');
  fg.width = W;
  fg.height = H;
  const fctx = fg.getContext('2d')!;
  fctx.drawImage(mask.canvas, 0, 0, W, H);
  fctx.globalCompositeOperation = 'source-in';
  fctx.drawImage(image, 0, 0, W, H);
  dst.drawImage(fg, 0, 0);
}

export function drawMaskOverlay(
  dst: CanvasRenderingContext2D,
  maskCanvas: HTMLCanvasElement,
  W: number,
  H: number,
  fill: string
): void {
  const overlay = document.createElement('canvas');
  overlay.width = W;
  overlay.height = H;
  const octx = overlay.getContext('2d')!;
  octx.drawImage(maskCanvas, 0, 0, W, H);
  octx.globalCompositeOperation = 'source-in';
  octx.fillStyle = fill;
  octx.fillRect(0, 0, W, H);
  dst.drawImage(overlay, 0, 0);
}

export function drawMaskOutline(
  dst: CanvasRenderingContext2D,
  maskCanvas: HTMLCanvasElement,
  W: number,
  H: number,
  color: string,
  offset: number
): void {
  const filled = document.createElement('canvas');
  filled.width = W;
  filled.height = H;
  const fctx = filled.getContext('2d')!;
  fctx.drawImage(maskCanvas, 0, 0, W, H);
  fctx.globalCompositeOperation = 'source-in';
  fctx.fillStyle = '#fff';
  fctx.fillRect(0, 0, W, H);

  const outline = document.createElement('canvas');
  outline.width = W;
  outline.height = H;
  const octx = outline.getContext('2d')!;
  for (const [dx, dy] of [
    [-offset, 0],
    [offset, 0],
    [0, -offset],
    [0, offset]
  ]) {
    octx.drawImage(filled, dx, dy);
  }
  octx.globalCompositeOperation = 'destination-out';
  octx.drawImage(filled, 0, 0);
  octx.globalCompositeOperation = 'source-in';
  octx.fillStyle = color;
  octx.fillRect(0, 0, W, H);

  dst.drawImage(outline, 0, 0);
}
