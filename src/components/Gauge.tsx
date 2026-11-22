import { arcPath, polar, zoneArcs } from "@/lib/gauge";

const CX = 150;
const CY = 150;
const R = 116;
const HUB = 25;

/** A dial in the style of the Fear & Greed Index: zones named along the arc, the reading in the hub. */
export function Gauge({ fraction, value, zone }: { fraction: number; value: string; zone: string }) {
  const ticks = Array.from({ length: 51 }, (_, k) => {
    const a = Math.PI - (k / 50) * Math.PI;
    const [x1, y1] = polar(CX, CY, R - 17, a);
    const [x2, y2] = polar(CX, CY, R - (k % 10 ? 21 : 26), a);
    return <line key={k} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(0,0,0,.2)" strokeWidth={k % 10 ? 0.7 : 1.1} />;
  });
  const arcs = zoneArcs(CX, CY, R);
  const n = arcs.length;
  return (
    <svg className="gauge" viewBox="0 0 300 180" aria-hidden="true">
      {arcs.map(({ zone: z, d }, i) => (
        <g key={z.name}>
          <path d={d} stroke={z.color} strokeWidth={20} fill="none" />
          <path
            id={`zone-${i}`}
            d={arcPath(CX, CY, R + 16, Math.PI - (i / n) * Math.PI, Math.PI - ((i + 1) / n) * Math.PI)}
            fill="none"
          />
          <text className="zone-label" data-active={z.name === zone || undefined}>
            <textPath href={`#zone-${i}`} startOffset="50%" textAnchor="middle">
              {z.name}
            </textPath>
          </text>
        </g>
      ))}
      {ticks}
      <g className="needle" style={{ transform: `rotate(${-90 + fraction * 180}deg)` }}>
        <path d={`M${CX - 5} ${CY} L${CX} ${CY - R + 30} L${CX + 5} ${CY} Z`} fill="#111" />
      </g>
      <circle cx={CX} cy={CY} r={HUB} fill="#111" />
      <text x={CX} y={CY} className="gauge-value" textAnchor="middle" dominantBaseline="central">
        {value}
      </text>
    </svg>
  );
}
