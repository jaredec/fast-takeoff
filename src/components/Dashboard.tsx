"use client";

import { useMemo, useState } from "react";
import type { Dataset } from "@/lib/data";
import { formatDay, makeSeries, toDay, TRACK_INFO, TRACKS, type Track, type Unit } from "@/lib/metrics";
import { DayGrid } from "./DayGrid";
import { Index } from "./Index";
import { RecentList } from "./RecentList";
import { SharePanel } from "./SharePanel";
import { SpeedChart } from "./SpeedChart";
import { Timeline } from "./Timeline";
import { TipProvider } from "./Tip";
import { Toc } from "./Toc";

export function Dashboard({ meta, tracks }: Dataset) {
  const [unit, setUnit] = useState<Unit>("month");
  const [track, setTrack] = useState<Track>("breakthroughs");
  const series = useMemo(
    () => ({ breakthroughs: makeSeries(tracks.breakthroughs, meta), releases: makeSeries(tracks.releases, meta) }),
    [meta, tracks],
  );
  const s = series[track];
  const noun = TRACK_INFO[track].noun;

  const tabs = (
    <span className="tabs">
      {TRACKS.map((t) => (
        <button key={t} aria-pressed={t === track} onClick={() => setTrack(t)}>
          {TRACK_INFO[t].label}
        </button>
      ))}
    </span>
  );
  const head = (title: string) => (
    <div className="section-head">
      <h2>{title}</h2>
      {tabs}
    </div>
  );

  return (
    <TipProvider>
      <div className="page">
        <Toc asOf={formatDay(toDay(meta.asOf))} />
        <main data-track={track}>
          <h1>Fast Takeoff</h1>
          <p className="lede">
            A <b>fast takeoff</b> (or an AI going &ldquo;FOOM&rdquo;) is AI capability racing from human level to far
            beyond it in months, days or less. This page measures how fast we&rsquo;re going: every breakthrough and
            every new model, and how quickly they&rsquo;re arriving.
          </p>

          <Index breakthroughs={series.breakthroughs} releases={series.releases} unit={unit} onUnit={setUnit} />

          <section id="timeline" className="section">
            {head("Timeline")}
            <p className="section-sub">
              {track === "breakthroughs"
                ? "Every breakthrough since Deep Blue. "
                : "Every major model release since GPT-1. "}
              The space between two events grows with the time between them, so watch the gaps shrink.
            </p>
            <Timeline series={s} track={track} />
          </section>

          <section id="speed" className="section">
            {head("Speed over time")}
            <p className="section-sub">
              {noun[0].toUpperCase() + noun.slice(1)} per month, averaged over the trailing 90 days. Hover to scrub.
            </p>
            <SpeedChart series={s} track={track} />
          </section>

          <section id="every-day" className="section">
            {head("Every day")}
            <p className="section-sub">One square per day. Empty squares are days with no {noun}. Click a day to see what happened.</p>
            <DayGrid key={track} series={s} />
          </section>

          <section id="recent" className="section">
            {head("Recent")}
            <RecentList key={track} series={s} />
          </section>

          <section id="post" className="section">
            {head("The daily post")}
            <p className="section-sub">
              What @thefasttakeoff posts each morning. The unit follows the switch on the index above.
            </p>
            <SharePanel series={s} track={track} unit={unit} />
          </section>

          <section id="method" className="section">
            <h2>What counts</h2>
            <div className="notes">
              <div>
                <h3>A breakthrough</h3>
                <ul>
                  <li>Something AI could not do before, shown in public for the first time.</li>
                  <li>It beats the previous best by a clear margin, or opens a new category.</li>
                  <li>People outside AI talked about it.</li>
                  <li>Funding rounds, minor model updates and hires don&rsquo;t count.</li>
                </ul>
              </div>
              <div>
                <h3>A release</h3>
                <ul>
                  <li>A new model from a major lab that people can use, by app, API or open weights.</li>
                  <li>New versions count (Opus 4.5, GPT-5.1). Price cuts and renamed tiers don&rsquo;t.</li>
                  <li>A model can be both a release and a breakthrough, like ChatGPT or GPT-4.</li>
                </ul>
              </div>
              <div>
                <h3>The number</h3>
                <ul>
                  <li>The speed is the count in the last 90 days, divided by the days tracked.</li>
                  <li>
                    Zones, in breakthroughs a month: AI Winter is under 0.25, Steady is under 1, Accelerating is under
                    2.5, Takeoff is under 5, and FOOM is 5 or more.
                  </li>
                </ul>
              </div>
              <div>
                <h3>The data</h3>
                <ul>
                  <li>This is a mock. Dates through Nov 2025 come from the public record.</li>
                  <li>Dec 2025 to Aug 2026 isn&rsquo;t backfilled yet, so the current reading runs low.</li>
                </ul>
              </div>
            </div>
          </section>

          <footer>
            thefasttakeoff.com · <a href="https://x.com/thefasttakeoff">@thefasttakeoff</a>
          </footer>
        </main>
      </div>
    </TipProvider>
  );
}
