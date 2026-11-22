"use client";

import { useMemo, useState } from "react";
import { BASE_PATH } from "@/lib/basePath";
import type { Dataset } from "@/lib/data";
import { formatDay, makeSeries, TRACK_INFO, TRACKS, type Track } from "@/lib/metrics";
import { Gaps } from "./Gaps";
import { Index } from "./Index";
import { RANGES, Timeline, type Range } from "./Timeline";
import { TipProvider } from "./Tip";

export function Dashboard({ meta, tracks, takeoff }: Dataset) {
  const [track, setTrack] = useState<Track>("breakthroughs");
  const [range, setRange] = useState<Range>("all");
  const series = useMemo(
    () => ({ breakthroughs: makeSeries(tracks.breakthroughs, meta), releases: makeSeries(tracks.releases, meta) }),
    [meta, tracks],
  );
  const s = series[track];

  return (
    <TipProvider>
      <div className="page" data-track={track}>
        <header className="masthead">
          <h1 className="wordmark">
            <a href={BASE_PATH}>Fast Takeoff</a>
          </h1>
          <nav className="toc">
            <a href="#index">Index</a>
            <a href="#gaps">Time between</a>
            <a href="#timeline">Timeline</a>
            <a href={`${BASE_PATH}/card/${track}/month`}>Today&rsquo;s card</a>
            <a href="https://x.com/thefasttakeoff">Follow</a>
          </nav>
        </header>

        <main>
          <p className="lede">
            Fast takeoff refers to a scenario in which an AI transitions rapidly from roughly human-level intelligence to
            vastly superhuman intelligence, with the change occurring over a very short period&mdash;potentially days or
            even hours.
          </p>

          <Index takeoff={takeoff} series={series} />

          <Gaps series={series} />

          <section id="timeline">
            <h2>Timeline</h2>
            <div className="tl-controls">
              <div className="seg tabs" role="tablist">
                {TRACKS.map((t) => (
                  <button key={t} role="tab" aria-selected={t === track} onClick={() => setTrack(t)}>
                    {TRACK_INFO[t].label}
                  </button>
                ))}
              </div>
              <div className="seg ranges">
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

        <footer className="foot">
          Fast Takeoff by <a href="https://www.jaredconnolly.com">Jared Connolly</a> · Updated through{" "}
          {formatDay(s.asOf, { month: "long", day: "numeric" })}
        </footer>
      </div>
    </TipProvider>
  );
}
