"use client";

import { useMemo, useState } from "react";
import type { Dataset } from "@/lib/data";
import { makeSeries, TRACK_INFO, TRACKS, type Track, type Unit } from "@/lib/metrics";
import { Index } from "./Index";
import { Header, Sidebar } from "./Nav";
import { RANGES, Timeline, type Range } from "./Timeline";
import { TipProvider } from "./Tip";

export function Dashboard({ meta, tracks }: Dataset) {
  const [unit, setUnit] = useState<Unit>("month");
  const [track, setTrack] = useState<Track>("breakthroughs");
  const [toggled, setToggled] = useState(false);
  const [range, setRange] = useState<Range>("all");
  const series = useMemo(
    () => ({ breakthroughs: makeSeries(tracks.breakthroughs, meta), releases: makeSeries(tracks.releases, meta) }),
    [meta, tracks],
  );
  const s = series[track];

  return (
    <TipProvider>
      <Header onMenu={() => setToggled((t) => !t)} />
      <div className="layout" data-track={track} data-toggled={toggled}>
        <Sidebar onClose={() => setToggled(false)} track={track} onTrack={setTrack} series={s} />
        <main className="main">
          <section className="card def">
            <h1 className="spot-def">
              <dfn>Fast takeoff</dfn> refers to a scenario in which an AI transitions rapidly from roughly human-level
              intelligence to vastly superhuman intelligence, with the change occurring over a very short
              period&mdash;potentially days or even hours.
            </h1>
          </section>

          <Index series={series.breakthroughs} unit={unit} onUnit={setUnit} />

          <section id="timeline" className="card">
            <h2 className="card-title">Timeline</h2>
            <div className="tl-controls">
              <div className="tabs" role="tablist">
                {TRACKS.map((t) => (
                  <button key={t} role="tab" aria-selected={t === track} onClick={() => setTrack(t)}>
                    {TRACK_INFO[t].label}
                  </button>
                ))}
              </div>
              <div className="ranges">
                {RANGES.map((r) => (
                  <button key={r.id} aria-pressed={r.id === range} onClick={() => setRange(r.id)}>
                    {r.label}
                  </button>
                ))}
              </div>
            </div>
            <Timeline series={s} range={range} />
          </section>
        </main>
      </div>
    </TipProvider>
  );
}
