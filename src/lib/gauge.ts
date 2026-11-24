import { ZONES } from "./takeoff";

export const polar = (cx: number, cy: number, r: number, angle: number): [number, number] => [
  cx + r * Math.cos(angle),
  cy - r * Math.sin(angle),
];

export function arcPath(cx: number, cy: number, r: number, from: number, to: number) {
  const [x0, y0] = polar(cx, cy, r, from);
  const [x1, y1] = polar(cx, cy, r, to);
  return `M${x0.toFixed(2)} ${y0.toFixed(2)}A${r} ${r} 0 0 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`;
}

/** One arc per zone across the top half of a circle, left to right, sized to its range, with a small gap between zones. */
export function zoneArcs(cx: number, cy: number, r: number, gap = 0.018) {
  const n = ZONES.length;
  return ZONES.map((zone, i) => {
    const from = Math.PI - (zone.from / 100) * Math.PI;
    const to = Math.PI - (zone.to / 100) * Math.PI;
    return {
      zone,
      d: arcPath(cx, cy, r, i ? from - gap : from, i === n - 1 ? to : to + gap),
      mid: (from + to) / 2,
    };
  });
}

/** The needle as a thin triangle pointing at `fraction` of the way around (0 is left, 1 is right). */
export function needlePoints(cx: number, cy: number, length: number, fraction: number, halfWidth = 4.5) {
  const a = Math.PI - fraction * Math.PI;
  const [tx, ty] = polar(cx, cy, length, a);
  const [lx, ly] = polar(cx, cy, halfWidth, a + Math.PI / 2);
  const [rx, ry] = polar(cx, cy, halfWidth, a - Math.PI / 2);
  return `${tx.toFixed(2)},${ty.toFixed(2)} ${lx.toFixed(2)},${ly.toFixed(2)} ${rx.toFixed(2)},${ry.toFixed(2)}`;
}
