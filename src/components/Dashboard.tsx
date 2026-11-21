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
  const [zoomedOut, setZoomedOut] = useState(false);
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
            <h1 className="card-title">Fast takeoff</h1>
            <p className="spot-sub">noun</p>
            <p className="spot-def">
              The point where AI becomes smart enough to improve itself, and every improvement makes the next one come
              sooner. Once that loop starts, AI could go from about as capable as a person to far beyond any person in a
              few months, or even a few days.
            </p>
            <p className="spot-def">
              The alternative is a slow takeoff: the same climb spread over years or decades, with time for people to
              adjust along the way. This site tracks how quickly AI is making real discoveries, to show which one we are
              in.
            </p>
          </section>

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
            <Timeline key={track} series={s} zoomedOut={zoomedOut} onZoom={setZoomedOut} />
          </section>
        </main>
      </div>
    </TipProvider>
  );
}
