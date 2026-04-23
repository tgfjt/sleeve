export const HIT_MARGIN = 30;

export function hitTestLayer(
  point: { x: number; y: number },
  center: { x: number; y: number },
  box: { width: number; height: number }
): boolean {
  return (
    Math.abs(point.x - center.x) < box.width / 2 + HIT_MARGIN &&
    Math.abs(point.y - center.y) < box.height / 2 + HIT_MARGIN
  );
}
