"use client";

import { useMemo, useState } from "react";
import type { Dataset } from "@/lib/data";
import { formatDay, makeSeries, toDay, TRACK_INFO, TRACKS, type Track, type Unit } from "@/lib/metrics";
import { DayGrid } from "./DayGrid";
import { Index } from "./Index";
import { SpeedChart } from "./SpeedChart";
import { Timeline } from "./Timeline";
import { TipProvider } from "./Tip";

export function Dashboard({ meta, tracks }: Dataset) {
  const [unit, setUnit] = useState<Unit>("month");
  const [track, setTrack] = useState<Track>("breakthroughs");
  const series = useMemo(
    () => ({ breakthroughs: makeSeries(tracks.breakthroughs, meta), releases: makeSeries(tracks.releases, meta) }),
    [meta, tracks],
  );
  const s = series[track];

  const head = (title: string) => (
    <div className="section-head">
      <h2>{title}</h2>
      <span className="tabs">
        {TRACKS.map((t) => (
          <button key={t} aria-pressed={t === track} onClick={() => setTrack(t)}>
            {TRACK_INFO[t].label}
          </button>
        ))}
      </span>
    </div>
  );

  return (
    <TipProvider>
      <main className="page" data-track={track}>
        <h1>Fast Takeoff</h1>
        <p className="lede">How fast is AI moving? Updated {formatDay(toDay(meta.asOf))}.</p>

        <Index breakthroughs={series.breakthroughs} releases={series.releases} unit={unit} onUnit={setUnit} />

        <section className="section">
          {head("Timeline")}
          <div className="wide">
            <Timeline key={track} series={s} />
          </div>
        </section>

        <section className="section">
          {head("Speed")}
          <SpeedChart series={s} track={track} />
        </section>

        <section className="section">
          {head("Every day")}
          <DayGrid key={track} series={s} />
        </section>

      </main>
    </TipProvider>
  );
}
