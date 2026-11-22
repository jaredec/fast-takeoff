import { polar, zoneArcs } from "@/lib/gauge";

const CX = 150;
const CY = 150;
const R = 116;

export function Gauge({ fraction }: { fraction: number }) {
  const ticks = Array.from({ length: 51 }, (_, k) => {
    const a = Math.PI - (k / 50) * Math.PI;
    const [x1, y1] = polar(CX, CY, R - 17, a);
    const [x2, y2] = polar(CX, CY, R - (k % 10 ? 21 : 26), a);
    return <line key={k} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(0,0,0,.2)" strokeWidth={k % 10 ? 0.7 : 1.1} />;
  });
  return (
    <svg className="gauge" viewBox="0 0 300 174" aria-hidden="true">
      {zoneArcs(CX, CY, R).map(({ zone, d }, i) => (
        <g key={zone.name}>
          <path d={d} stroke={zone.color} strokeWidth={20} fill="none" />
          <text x={i ? CX + R + 10 : CX - R - 10} y={CY + 18} textAnchor={i ? "end" : "start"} className="zone-label">
            {zone.name}
          </text>
        </g>
      ))}
      {ticks}
      <g className="needle" style={{ transform: `rotate(${-90 + fraction * 180}deg)` }}>
        <path d={`M${CX - 4} ${CY} L${CX} ${CY - R + 30} L${CX + 4} ${CY} Z`} fill="#424242" />
      </g>
      <circle cx={CX} cy={CY} r={8} fill="#424242" />
      <circle cx={CX} cy={CY} r={3} fill="#fff" />
    </svg>
  );
}
