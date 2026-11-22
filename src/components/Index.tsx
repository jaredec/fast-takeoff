"use client";

import type { CSSProperties } from "react";
import { formatRate, reading, UNITS, type Series, type Unit } from "@/lib/metrics";
import { Gauge } from "./Gauge";

export function Index({ series, unit, onUnit }: { series: Series; unit: Unit; onUnit: (u: Unit) => void }) {
  const r = reading(series);
  const value = r.rate ? r.rate.perDay * UNITS[unit] : 0;
  return (
    <section id="index">
      <h2>The Fast Takeoff Index</h2>
      <div className="index">
        <Gauge fraction={r.fraction} value={formatRate(value)} zone={r.zone.name} />
        <div>
          <p className="kicker mono">AI is moving at</p>
          <p className="big">{formatRate(value)}</p>
          <div className="unitline">
            <span>breakthroughs a {unit}</span>
            <span className="units mono">
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
