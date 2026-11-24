import { arcPath, polar, zoneArcs } from "@/lib/gauge";

const CX = 150;
const CY = 150;
const R = 108;
const BAND = 34;
const HUB = 25;

/** A dial in the style of the Fear & Greed Index: thick gray zones named along the arc, the reading in the hub. */
export function Gauge({ fraction, value, zone }: { fraction: number; value: string; zone: string }) {
  const inner = R - BAND / 2;
  const ticks = Array.from({ length: 51 }, (_, k) => {
    const a = Math.PI - (k / 50) * Math.PI;
    const [x1, y1] = polar(CX, CY, inner - 4, a);
    const [x2, y2] = polar(CX, CY, inner - (k % 10 ? 8 : 13), a);
    return <line key={k} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(0,0,0,.2)" strokeWidth={k % 10 ? 0.7 : 1.1} />;
  });
  const arcs = zoneArcs(CX, CY, R);
  return (
    <svg className="gauge" viewBox="0 0 300 180" aria-hidden="true">
      {arcs.map(({ zone: z, d, mid }, i) => {
        // The label's path is at least 50° wide so the narrow zones' names aren't cut off.
        const half = Math.max(0.44, ((z.to - z.from) / 200) * Math.PI);
        const active = z.name === zone || undefined;
        return (
          <g key={z.name}>
            <path className="zone-arc" data-active={active} d={d} strokeWidth={BAND} fill="none" />
            <path id={`zone-${i}`} d={arcPath(CX, CY, R + BAND / 2 + 8, mid + half, mid - half)} fill="none" />
            <text className="zone-label" data-active={active}>
              <textPath href={`#zone-${i}`} startOffset="50%" textAnchor="middle">
                {z.name}
              </textPath>
            </text>
          </g>
        );
      })}
      {ticks}
      <g className="needle" style={{ transform: `rotate(${-90 + fraction * 180}deg)` }}>
        <path d={`M${CX - 5} ${CY} L${CX} ${CY - inner + 12} L${CX + 5} ${CY} Z`} fill="#111" />
      </g>
      <circle cx={CX} cy={CY} r={HUB} fill="#111" />
      <text x={CX} y={CY} className="gauge-value" textAnchor="middle" dominantBaseline="central">
        {value}
      </text>
    </svg>
  );
}
