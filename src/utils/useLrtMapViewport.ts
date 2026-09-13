import { useEffect, useRef, useState, type PointerEvent } from 'react';
import { FULL_MAP, MAP_WIDTH, MAP_HEIGHT, MOBILE_MAP_HEIGHT, zoomViewport, type MapViewport } from './lrtMapViewport';

type Point = { x: number; y: number };
type Gesture = { view: MapViewport; center: Point; distance: number; count: number };

export function useLrtMapViewport(cancelDrag: () => void, isDragging: () => boolean, suppressClick: () => void) {
 const [mobile, setMobile] = useState(false);
 const [view, setView] = useState(FULL_MAP);
 const current = useRef(FULL_MAP);
 const pointers = useRef(new Map<number, Point>());
 const gesture = useRef<Gesture | null>(null);
 const moved = useRef(false);

 function update(next: MapViewport) { current.current = next; setView(next); }
 function clear() { pointers.current.clear(); gesture.current = null; moved.current = false; }
 function reset() { cancelDrag(); clear(); update(FULL_MAP); }
 function showAll() { cancelDrag(); clear(); update(FULL_MAP); }

 useEffect(() => {
  const media = window.matchMedia('(max-width: 760px)');
  const change = () => {
   setMobile(media.matches);
   pointers.current.clear(); gesture.current = null;
   current.current = FULL_MAP; setView(FULL_MAP);
  };
  change(); media.addEventListener('change', change);
  return () => media.removeEventListener('change', change);
 }, []);

 function position() {
  const [a,b] = [...pointers.current.values()];
  if (!a) return null;
  return {
   center: b ? { x:(a.x+b.x)/2, y:(a.y+b.y)/2 } : a,
   distance: b ? Math.hypot(b.x-a.x,b.y-a.y) : 0,
   count: b ? 2 : 1,
  };
 }
 function rebase() {
  const point = position();
  gesture.current = point ? { ...point, view: current.current } : null;
 }
 function down(event: PointerEvent<SVGSVGElement>) {
  if (!mobile || event.button !== 0) return;
  if (!pointers.current.size) moved.current = false;
  pointers.current.set(event.pointerId, {x:event.clientX,y:event.clientY});
  if (pointers.current.size > 1) {
   cancelDrag(); moved.current = true; suppressClick();
   event.currentTarget.setPointerCapture(event.pointerId);
  }
  rebase();
 }
 function move(event: PointerEvent<SVGSVGElement>) {
  if (!mobile || !pointers.current.has(event.pointerId)) return;
  pointers.current.set(event.pointerId, {x:event.clientX,y:event.clientY});
  if (isDragging()) return;
  const start = gesture.current, end = position();
  if (!start || !end) return;
  if (!moved.current && end.count === 1 && Math.hypot(end.center.x-start.center.x,end.center.y-start.center.y)<5) return;
  moved.current = true; suppressClick();
  event.currentTarget.setPointerCapture(event.pointerId);
  const rect = event.currentTarget.getBoundingClientRect();
  const normalize = (p:Point) => ({x:(p.x-rect.left)/rect.width,y:(p.y-rect.top)/rect.height});
  update(zoomViewport(start.view, start.distance > 0 ? end.distance/start.distance : 1, normalize(start.center), normalize(end.center), mobile ? MOBILE_MAP_HEIGHT : MAP_HEIGHT));
 }
 function end(event: PointerEvent<SVGSVGElement>) {
  if (!pointers.current.delete(event.pointerId)) return;
  if (moved.current) suppressClick();
  rebase();
 }
 function zoom(scale: number) {
  cancelDrag(); clear();
  update(zoomViewport(current.current, scale, {x:.5,y:.5}, {x:.5,y:.5}, mobile ? MOBILE_MAP_HEIGHT : MAP_HEIGHT));
 }
 return {
  mobile, down, move, end, reset, showAll, zoom,
  multiplePointers: () => pointers.current.size > 1,
  zoomed: view.width < MAP_WIDTH - .1,
  maxZoom: view.width <= MAP_WIDTH/3 + .1,
  viewBox: `${view.x} ${view.y} ${view.width} ${view.width * (mobile ? MOBILE_MAP_HEIGHT : MAP_HEIGHT) / MAP_WIDTH}`,
 };
}
