"use client";

import { useMemo, useState, type CSSProperties } from "react";
import type { Dataset } from "@/lib/data";
import { makeSeries, TRACK_INFO, TRACKS, type Track } from "@/lib/metrics";
import { readIndex } from "@/lib/takeoff";
import { Gauge } from "./Gauge";
import { RANGES, Timeline, type Range } from "./Timeline";
import { TipProvider } from "./Tip";

export function Viz({ meta, tracks, takeoff }: Dataset) {
  const [track, setTrack] = useState<Track>("breakthroughs");
  const [range, setRange] = useState<Range>("all");
  const series = useMemo(
    () => ({ breakthroughs: makeSeries(tracks.breakthroughs, meta), releases: makeSeries(tracks.releases, meta) }),
    [meta, tracks],
  );
  const { score, zone } = readIndex(takeoff, series);

  return (
    <TipProvider>
      <div className="viz" data-track={track}>
        <h1>Fast Takeoff Index</h1>
        <div className="reading">
          <Gauge fraction={score / 100} value={String(Math.round(score))} zone={zone.name} />
          <p className="zone" style={{ "--zc": zone.color } as CSSProperties}>
            <i />
            {zone.name}
          </p>
        </div>

        <h1 id="timeline">Timeline</h1>
        <p className="switch">
          <span>
            {TRACKS.map((t) => (
              <button key={t} aria-pressed={t === track} onClick={() => setTrack(t)}>
                {TRACK_INFO[t].label}
              </button>
            ))}
          </span>
          <span>
            {RANGES.map((r) => (
              <button key={r.id} aria-pressed={r.id === range} onClick={() => setRange(r.id)}>
                {r.label}
              </button>
            ))}
          </span>
        </p>
        <Timeline series={series[track]} range={range} />
      </div>
    </TipProvider>
  );
}
