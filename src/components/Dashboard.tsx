import type { CSSProperties } from "react";
import { BASE_PATH } from "@/lib/basePath";
import type { Dataset } from "@/lib/data";
import { formatDay, formatInterval, gaps, makeSeries, TRACK_INFO, TRACKS, type Series } from "@/lib/metrics";
import { formatTimes, PACE_PER_ZONE, readIndex } from "@/lib/takeoff";
import { Gauge } from "./Gauge";
import { TimelineSection } from "./TimelineSection";

function Events({ series }: { series: Series }) {
  return (
    <ul>
      {[...series.events].reverse().map((e) => (
        <li key={`${e.date} ${e.title}`}>
          <b>{e.title}.</b> {e.why}{" "}
          <i>
            {e.org}, {formatDay(e.day)}.
          </i>
        </li>
      ))}
    </ul>
  );
}

export function Dashboard({ meta, tracks, takeoff }: Dataset) {
  const series = { breakthroughs: makeSeries(tracks.breakthroughs, meta), releases: makeSeries(tracks.releases, meta) };
  const { score, zone, signals } = readIndex(takeoff, series);

  return (
    <div className="page">
      <h1>Fast Takeoff</h1>

      <div className="cols">
        <div className="side">
          <section id="index">
            <h2>The Fast Takeoff Index</h2>
            <div className="reading">
              <Gauge fraction={score / 100} value={String(Math.round(score))} zone={zone.name} />
              <p className="zone" style={{ "--zc": zone.color } as CSSProperties}>
                <i />
                {zone.name}
              </p>
            </div>
            <p>
              It stands at <b>{Math.round(score)}</b> out of 100: <b>{zone.name.toLowerCase()}</b>. It averages the
              signals below the way CNN&rsquo;s{" "}
              <a href="https://www.cnn.com/markets/fear-and-greed">Fear &amp; Greed Index</a> averages seven market
              signals. Each scores 50 when it moves at its old pace, 75 at {PACE_PER_ZONE} times that pace and 25 at{" "}
              {PACE_PER_ZONE} times slower.
            </p>
            <ul>
              {signals.map((s) => (
                <li key={s.name}>
                  <b>{s.name}.</b> {s.now}, against {s.was}; {s.pace ?? `${formatTimes(s.speed)} the old pace`}. It
                  scores {Math.round(s.score)}.{" "}
                  <i>
                    Source: <a href={s.url}>{s.source}</a>.
                  </i>
                </li>
              ))}
            </ul>
            <p className="note">
              The figures are copied from each source&rsquo;s latest update. The forecasters&rsquo; earlier date is
              from <a href={takeoff.metaculus.before.url}>Intelligence Progress</a>.
            </p>
          </section>

          <TimelineSection meta={meta} tracks={tracks} />

          <section id="gaps">
            <h2>Time between</h2>
            <ul>
              {TRACKS.map((t) => {
                const g = gaps(series[t]);
                return (
                  <li key={t}>
                    <b>{TRACK_INFO[t].label}.</b> One every {g.recent ? formatInterval(g.recent) : "—"} over the last
                    year, against one every {g.before ? formatInterval(g.before) : "—"} in the five years before.
                    {g.latest !== null &&
                      (g.latest === 0
                        ? " The latest two came the same day."
                        : ` The latest came ${g.latest === 1 ? "1 day" : formatInterval(g.latest)} after the one before.`)}
                  </li>
                );
              })}
            </ul>
          </section>
        </div>

        <section id="breakthroughs" className="side">
          <h2>Breakthroughs</h2>
          <p>
            Firsts for humankind made by AI: new science, math or medicine, or a historic first the whole world noticed.
          </p>
          <Events series={series.breakthroughs} />
          <footer className="thanks">
            Fast Takeoff by <a href="https://www.jaredconnolly.com">Jared Connolly</a>. Updated through{" "}
            {formatDay(series.breakthroughs.asOf, { month: "long", day: "numeric", year: "numeric" })}.{" "}
            <a href={`${BASE_PATH}/card/breakthroughs/month`}>Today&rsquo;s card</a> &middot;{" "}
            <a href="https://x.com/thefasttakeoff">Follow on X</a>
          </footer>
        </section>
      </div>
    </div>
  );
}
