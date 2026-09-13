export type MapViewport = { x: number; y: number; width: number };
export const MAP_WIDTH = 660;
export const MAP_HEIGHT = 865;
export const MOBILE_MAP_HEIGHT = 1100;
export const FULL_MAP: MapViewport = { x: 0, y: 0, width: MAP_WIDTH };

export function constrainViewport(view: MapViewport, height = MAP_HEIGHT): MapViewport {
 const width = Math.max(MAP_WIDTH / 3, Math.min(MAP_WIDTH, view.width));
 return {
  width,
  x: Math.max(0, Math.min(MAP_WIDTH - width, view.x)),
  y: Math.max(0, Math.min(height - width * height / MAP_WIDTH, view.y)),
 };
}

// Keep the map point under the gesture's original midpoint under its new midpoint.
export function zoomViewport(view: MapViewport, scale: number, start: {x:number;y:number}, end = start, height = MAP_HEIGHT): MapViewport {
 const width = Math.max(MAP_WIDTH / 3, Math.min(MAP_WIDTH, view.width / scale));
 return constrainViewport({
  width,
  x: view.x + start.x * view.width - end.x * width,
  y: view.y + (start.y * view.width - end.y * width) * height / MAP_WIDTH,
 }, height);
}
