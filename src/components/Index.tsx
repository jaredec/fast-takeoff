"use client";

import type { CSSProperties } from "react";
import { formatDay, formatInterval, formatRate, MONTH, reading, UNITS, type Series, type Unit } from "@/lib/metrics";
import { Gauge } from "./Gauge";

export function Index({
  breakthroughs,
  releases,
  unit,
  onUnit,
}: {
  breakthroughs: Series;
  releases: Series;
  unit: Unit;
  onUnit: (u: Unit) => void;
}) {
  const r = reading(breakthroughs);
  const rel = reading(releases);
  const value = r.rate ? r.rate.perDay * UNITS[unit] : 0;
  return (
    <section id="index" className="index">
      <Gauge fraction={r.fraction} />
      <div>
        <p className="kicker">As of {formatDay(r.asOf)}, AI is moving at</p>
        <p className="big">{formatRate(value)}</p>
        <div className="unitline">
          <span>breakthroughs a {unit}</span>
          <span className="tabs">
            {(Object.keys(UNITS) as Unit[]).map((u) => (
              <button key={u} aria-pressed={u === unit} onClick={() => onUnit(u)}>
                /{u}
              </button>
            ))}
          </span>
        </div>
        <p className="zone" style={{ "--zc": r.zone.color } as CSSProperties}>
          <i />
          {r.zone.name}
        </p>
      </div>
      <dl className="stats">
        <div>
          <dt>One every</dt>
          <dd>{r.rate && r.rate.perDay > 0 ? formatInterval(1 / r.rate.perDay) : "n/a"}</dd>
        </div>
        <div>
          <dt>vs. ten years ago</dt>
          <dd>{r.vsTenYears ? `${Math.round(r.vsTenYears)}× faster` : "n/a"}</dd>
        </div>
        <div>
          <dt>Model releases</dt>
          <dd>{rel.rate ? `${formatRate(rel.rate.perDay * MONTH)} a month` : "n/a"}</dd>
        </div>
        <div>
          <dt>Latest breakthrough</dt>
          <dd>{r.latest ? `${r.latest.title}, ${formatDay(r.latest.day, { month: "short", day: "numeric" })}` : "n/a"}</dd>
        </div>
      </dl>
    </section>
  );
}
