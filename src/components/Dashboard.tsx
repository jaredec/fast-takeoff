import type { CSSProperties, ReactNode } from "react";
import { BASE_PATH } from "@/lib/basePath";
import type { Dataset } from "@/lib/data";
import { countIn, formatDay, formatInterval, gaps, makeSeries, toDay, TRACK_INFO, TRACKS, yearsWord, type Series } from "@/lib/metrics";
import { readIndex } from "@/lib/takeoff";
import { Gauge } from "./Gauge";
import { TimelineSection } from "./TimelineSection";

function Fact({ label, source, url, date, children }: { label: string; source: string; url: string; date?: string; children: ReactNode }) {
  return (
    <li>
      <b>{label}.</b> {children}{" "}
      <i>
        <a href={url}>{source}</a>
        {date && `, ${formatDay(toDay(date))}`}.
      </i>
    </li>
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
  const years = TRACK_INFO.breakthroughs.baselineYears;
  const recent = countIn(b, b.asOf - 364, b.asOf);
  const before = countIn(b, b.asOf - (years + 1) * 365 + 1, b.asOf - 365);
  const latest = b.events.at(-1)!;
  const releaseYears = TRACK_INFO.releases.baselineYears;
  const releases = gaps(series.releases, releaseYears);

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
            <h3>Drivers</h3>
            <ul>
              <Fact label="Breakthroughs" source="Our count" url="#breakthroughs">
                {recent} in the past year, against {before} in the {yearsWord(years)} years before. Most recent:{" "}
                {latest.title}, {formatDay(latest.day)}.
              </Fact>
              {releases.recent && releases.before && (
                <Fact label="Frontier releases" source="Our count" url="#gaps">
                  One every {formatInterval(releases.recent)} in the past year, against one every{" "}
                  {formatInterval(releases.before)} in the {yearsWord(releaseYears)} years before.
                </Fact>
              )}
              {takeoff.forces.up.map((f) => (
                <Fact key={f.label} {...f}>
                  {f.text}
                </Fact>
              ))}
            </ul>
            <h3>Constraints</h3>
            <ul>
              {takeoff.forces.down.map((f) => (
                <Fact key={f.label} {...f}>
                  {f.text}
                </Fact>
              ))}
            </ul>
            <p className="note">
              Method. The index is the mean of five signals. Each scores 50 at its earlier pace and moves 25 points for
              every eightfold change in pace:{" "}
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
                const g = gaps(series[t], TRACK_INFO[t].baselineYears);
                return (
                  <li key={t}>
                    <b>{TRACK_INFO[t].label}.</b> One every {g.recent ? formatInterval(g.recent) : "—"} over the last
                    year, against one every {g.before ? formatInterval(g.before) : "—"} in the{" "}
                    {yearsWord(TRACK_INFO[t].baselineYears)} years before.
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
