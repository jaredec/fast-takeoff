"use client";

import type { CSSProperties } from "react";
import { formatDay, formatRate, reading, UNITS, type Series, type Unit } from "@/lib/metrics";
import { Gauge } from "./Gauge";

export function Index({ series, unit, onUnit }: { series: Series; unit: Unit; onUnit: (u: Unit) => void }) {
  const r = reading(series);
  const value = r.rate ? r.rate.perDay * UNITS[unit] : 0;
  return (
    <section id="index" className="card spot">
      <h1 className="card-title">The Fast Takeoff Index</h1>
      <p className="spot-sub">Updated {formatDay(r.asOf)}</p>
      <p className="spot-def">
        A <a href="https://www.lesswrong.com/w/ai-takeoff">fast takeoff</a> is AI going from human level to far beyond
        it in months, days or less. This tracks how fast we&rsquo;re heading there.
      </p>
      <div className="index">
        <Gauge fraction={r.fraction} />
        <div>
          <p className="kicker">AI is moving at</p>
          <p className="big">{formatRate(value)}</p>
          <div className="unitline">
            <span>breakthroughs a {unit}</span>
            <span className="units">
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
      </div>
    </section>
  );
}
