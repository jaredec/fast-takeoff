import type { CSSProperties } from "react";
import { BASE_PATH } from "@/lib/basePath";
import type { Dataset } from "@/lib/data";
import { countIn, formatDay, formatInterval, gaps, makeSeries, TRACK_INFO, TRACKS, type Series } from "@/lib/metrics";
import { readIndex } from "@/lib/takeoff";
import { Gauge } from "./Gauge";
import { TimelineSection } from "./TimelineSection";

function Source({ name, url }: { name: string; url: string }) {
  return (
    <i>
      <a href={url}>{name}</a>
    </i>
  );
}

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
  const b = series.breakthroughs;
  const recent = countIn(b, b.asOf - 364, b.asOf);
  const before = countIn(b, b.asOf - 6 * 365 + 1, b.asOf - 365);
  const latest = b.events.at(-1)!;
  const releases = gaps(series.releases);

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
              It stands at <b>{Math.round(score)}</b> out of 100: <b>{zone.name.toLowerCase()}</b>.
            </p>
            <h3>Speeding it up</h3>
            <ul>
              <li>
                {recent} breakthroughs in the past year, against {before} in the five years before. The latest:{" "}
                {latest.title}. <Source name="Our count" url="#breakthroughs" />
              </li>
              {releases.recent && (
                <li>
                  A new frontier model ships about every {formatInterval(releases.recent)}.{" "}
                  <Source name="Our count" url="#gaps" />
                </li>
              )}
              {takeoff.forces.up.map((f) => (
                <li key={f.text}>
                  {f.text} <Source name={f.source} url={f.url} />
                </li>
              ))}
            </ul>
            <h3>Holding it back</h3>
            <ul>
              {takeoff.forces.down.map((f) => (
                <li key={f.text}>
                  {f.text} <Source name={f.source} url={f.url} />
                </li>
              ))}
            </ul>
            <p className="note">
              The number averages five signals, each 50 at its old pace:{" "}
              {signals.map((s, i) => (
                <span key={s.name}>
                  {i ? ", " : ""}
                  <a href={s.url}>{s.name.toLowerCase()}</a> {Math.round(s.score)}
                </span>
              ))}
              .
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
