export type Point = { x: number; y: number };
export type Size = { width: number; height: number };
export type Rect = Size & { left: number; top: number };

export function clientToNatural(client: Point, rect: Rect, natural: Size): Point {
  return {
    x: ((client.x - rect.left) / rect.width) * natural.width,
    y: ((client.y - rect.top) / rect.height) * natural.height
  };
}

export function naturalToRect(point: Point, natural: Size, rect: Size): Point {
  return {
    x: (point.x / natural.width) * rect.width,
    y: (point.y / natural.height) * rect.height
  };
}
