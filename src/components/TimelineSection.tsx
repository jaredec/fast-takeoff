"use client";

import { useMemo, useState } from "react";
import type { Dataset } from "@/lib/data";
import { FIELD_COLORS, FIELDS } from "@/lib/logos";
import { makeSeries, TRACK_INFO, TRACKS, type Track } from "@/lib/metrics";
import { RANGES, Timeline, type Range } from "./Timeline";
import { TipProvider } from "./Tip";

export function TimelineSection({ meta, tracks }: Pick<Dataset, "meta" | "tracks">) {
  const [track, setTrack] = useState<Track>("breakthroughs");
  const [range, setRange] = useState<Range>("all");
  const series = useMemo(
    () => ({ breakthroughs: makeSeries(tracks.breakthroughs, meta), releases: makeSeries(tracks.releases, meta) }),
    [meta, tracks],
  );

  return (
    <TipProvider>
      <section id="timeline">
        <h2>Timeline</h2>
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
        {track === "breakthroughs" && (
          <p className="legend">
            {FIELDS.filter((f) => series.breakthroughs.events.some((e) => e.field === f)).map((f) => (
              <span key={f}>
                <i style={{ background: FIELD_COLORS[f] }} />
                {f}
              </span>
            ))}
          </p>
        )}
      </section>
    </TipProvider>
  );
}
