"use client";

import { useMemo, useState } from "react";
import type { Dataset } from "@/lib/data";
import { FIELD_GROUPS, fieldGroup, groupColor, type Field } from "@/lib/logos";
import { makeSeries, TRACK_INFO, TRACKS, type Track } from "@/lib/metrics";
import { RANGES, Timeline, type Range } from "./Timeline";
import { TipProvider } from "./Tip";
import { pick, useWho, WhoSwitch } from "./Who";

export function TimelineSection({ meta, tracks, human }: Pick<Dataset, "meta" | "tracks" | "human">) {
  const [track, setTrack] = useState<Track>("breakthroughs");
  const [range, setRange] = useState<Range>("5y");
  const [who] = useWho();
  const series = useMemo(
    () => ({
      breakthroughs: makeSeries(pick(who, tracks.breakthroughs, human), meta),
      releases: makeSeries(tracks.releases, meta),
    }),
    [meta, tracks, human, who],
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
        {track === "breakthroughs" && (
          <p className="switch who">
            <WhoSwitch />
          </p>
        )}
        <Timeline series={series[track]} range={range} rings={who === "both"} />
        {track === "breakthroughs" && (
          <p className="legend">
            {FIELD_GROUPS.filter((g) => series.breakthroughs.events.some((e) => e.field && fieldGroup(e.field as Field) === g)).map((g) => (
              <span key={g}>
                <i style={{ background: groupColor(g) }} />
                {g}
              </span>
            ))}
            {who === "both" && (
              <span>
                <i className="ring" />
                without AI
              </span>
            )}
          </p>
        )}
      </section>
    </TipProvider>
  );
}
