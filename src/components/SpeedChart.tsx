"use client";

import { useMemo, useRef, useState, type PointerEvent } from "react";
import { useElementWidth, useMediaQuery } from "@/lib/hooks";
import { formatDay, formatRate, MONTH, rateAt, reading, toDay, TRACK_INFO, ZONES, type Series, type Track } from "@/lib/metrics";
import { useTip } from "./Tip";

const START = toDay("2012-01-01");
const PAD = { l: 28, r: 6, t: 8, b: 22 };

export function SpeedChart({ series, track }: { series: Series; track: Track }) {
  const box = useRef<HTMLDivElement>(null);
  const width = useElementWidth(box);
  const narrow = useMediaQuery("(max-width: 640px)");
  const [hover, setHover] = useState<number | null>(null);
  const tip = useTip();
  const height = narrow ? 210 : 260;
  const color = TRACK_INFO[track].color;

  const samples = useMemo(() => {
    const out: { day: number; perMonth: number | null }[] = [];
    for (let d = START; d <= series.asOf; d += 7) {
      const r = rateAt(series, d);
      out.push({ day: d, perMonth: r ? r.perDay * MONTH : null });
    }
    const r = rateAt(series, series.asOf);
    out.push({ day: series.asOf, perMonth: r ? r.perDay * MONTH : null });
    return out;
  }, [series]);

  const shown = hover ?? series.asOf;
  const r = reading(series, shown);
  const readout = r.rate ? (
    <>
      {formatDay(shown)} · <b>{formatRate(r.perMonth)} a month</b>
      {track === "breakthroughs" && (
        <>
          {" "}
          · <span style={{ color: r.zone.color }}>●</span> {r.zone.name}
        </>
      )}
    </>
  ) : (
    <>{formatDay(shown)} · not backfilled yet</>
  );

  if (!width) return <div className="chart" ref={box} style={{ height }} />;

  const maxRate = Math.max(...samples.map((s) => s.perMonth ?? 0));
  const yMax = Math.max(3, Math.ceil(maxRate * 1.15));
  const X = (d: number) => PAD.l + ((d - START) / (series.asOf - START)) * (width - PAD.l - PAD.r);
  const Y = (v: number) => height - PAD.b - (v / yMax) * (height - PAD.t - PAD.b);

  const runs: [number, number][][] = [[]];
  for (const s of samples) {
    if (s.perMonth === null) {
      if (runs[runs.length - 1].length) runs.push([]);
    } else runs[runs.length - 1].push([X(s.day), Y(s.perMonth)]);
  }
  const live = runs.filter((run) => run.length > 1);
  const linePath = live.map((run) => run.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join("")).join("");
  const areaPath = live
    .map((run) => `M${run[0][0].toFixed(1)} ${Y(0)}` + run.map(([x, y]) => `L${x.toFixed(1)} ${y.toFixed(1)}`).join("") + `L${run[run.length - 1][0].toFixed(1)} ${Y(0)}Z`)
    .join("");

  const bands = track === "breakthroughs"
    ? ZONES.map((z, i) => ({ zone: z, lo: i ? ZONES[i - 1].max : 0, hi: Math.min(z.max, yMax) })).filter((b) => b.hi > b.lo)
    : [];
  const yearStep = width < 500 ? 4 : 2;

  const onMove = (e: PointerEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * width;
    const d = Math.round(Math.min(series.asOf, Math.max(START, START + ((x - PAD.l) / (width - PAD.l - PAD.r)) * (series.asOf - START))));
    setHover(d);
    const near = series.events.filter((ev) => ev.day <= d && ev.day > d - 90);
    if (near.length) {
      tip.show(
        <>
          <time>90 days before {formatDay(d)}</time>
          {near
            .slice(-4)
            .reverse()
            .map((ev) => (
              <b key={ev.date + ev.title} style={{ display: "block" }}>
                {ev.title}
              </b>
            ))}
        </>,
        e.clientX,
        e.clientY,
      );
    } else tip.hide();
  };

  return (
    <div className="chart" ref={box}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        height={height}
        onPointerMove={onMove}
        onPointerDown={onMove}
        onPointerLeave={() => {
          setHover(null);
          tip.hide();
        }}
      >
        <defs>
          <pattern id="hatch" width={6} height={6} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1={0} y1={0} x2={0} y2={6} stroke="rgba(0,0,0,.07)" strokeWidth={2} />
          </pattern>
          <linearGradient id={`fill-${track}`} x1={0} x2={0} y1={0} y2={1}>
            <stop offset={0} stopColor={color} stopOpacity={0.22} />
            <stop offset={1} stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        {bands.map((b) => (
          <g key={b.zone.name}>
            <rect x={PAD.l} width={width - PAD.l - PAD.r} y={Y(b.hi)} height={Y(b.lo) - Y(b.hi)} fill={b.zone.color} opacity={0.1} />
            {Y(b.lo) - Y(b.hi) > 16 && (
              <text x={PAD.l + 6} y={Y(b.hi) + 12} className="band-label" fill={b.zone.color}>
                {b.zone.name}
              </text>
            )}
          </g>
        ))}
        {Array.from({ length: Math.floor(yMax / (yMax > 6 ? 2 : 1)) + 1 }, (_, i) => i * (yMax > 6 ? 2 : 1)).map((v) => (
          <g key={v}>
            <line x1={PAD.l} x2={width - PAD.r} y1={Y(v)} y2={Y(v)} stroke="rgba(0,0,0,.06)" />
            <text x={PAD.l - 6} y={Y(v) + 3} textAnchor="end" className="axis">
              {v}
            </text>
          </g>
        ))}
        {Array.from({ length: Math.floor((2026 - 2012) / yearStep) + 1 }, (_, i) => 2012 + i * yearStep).map((y) => (
          <text key={y} x={X(toDay(`${y}-01-01`))} y={height - 5} textAnchor="middle" className="axis">
            {y}
          </text>
        ))}
        {series.untracked.map(([a, b]) => (
          <rect key={a} x={X(a)} width={X(Math.min(b, series.asOf)) - X(a)} y={PAD.t} height={height - PAD.t - PAD.b} fill="url(#hatch)" />
        ))}
        <path d={areaPath} fill={`url(#fill-${track})`} />
        <path d={linePath} fill="none" stroke={color} strokeWidth={1.8} strokeLinejoin="round" />
        {series.events.map((ev) => {
          if (ev.day < START) return null;
          const er = rateAt(series, ev.day);
          if (!er) return null;
          return <circle key={ev.date + ev.title} cx={X(ev.day)} cy={Y(er.perDay * MONTH)} r={2.8} fill="#fff" stroke="#424242" strokeWidth={1.2} pointerEvents="none" />;
        })}
        {hover !== null && (
          <>
            <line x1={X(hover)} x2={X(hover)} y1={PAD.t} y2={height - PAD.b} stroke="#424242" opacity={0.25} />
            {r.rate && <circle cx={X(hover)} cy={Y(r.perMonth)} r={4} fill={color} stroke="#fff" strokeWidth={2} />}
          </>
        )}
      </svg>
      <p className="readout">{readout}</p>
    </div>
  );
}
