"use client";

import { useMemo, useState } from "react";
import type { Dataset } from "@/lib/data";
import { makeSeries, TRACK_INFO, TRACKS, type Track, type Unit } from "@/lib/metrics";
import { Index } from "./Index";
import { Header, Sidebar } from "./Nav";
import { Timeline } from "./Timeline";
import { TipProvider } from "./Tip";

export function Dashboard({ meta, tracks }: Dataset) {
  const [unit, setUnit] = useState<Unit>("month");
  const [track, setTrack] = useState<Track>("breakthroughs");
  const [toggled, setToggled] = useState(false);
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
          <Index series={series.breakthroughs} unit={unit} onUnit={setUnit} />

          <div className="tabs" role="tablist">
            {TRACKS.map((t) => (
              <button key={t} role="tab" aria-selected={t === track} onClick={() => setTrack(t)}>
                {TRACK_INFO[t].label}
              </button>
            ))}
          </div>

          <section id="timeline" className="card">
            <h2 className="card-title">Timeline</h2>
            <Timeline key={track} series={s} />
          </section>
        </main>
      </div>
    </TipProvider>
  );
}
