import type { Dataset } from "@/lib/data";
import { countIn, formatDay, formatInterval, gaps, makeSeries, TRACK_INFO, TRACKS, yearsWord, type Series } from "@/lib/metrics";
import { paceFor, readIndex } from "@/lib/takeoff";
import { Gauge } from "./Gauge";
import { Pages } from "./Pages";
import { TimelineSection } from "./TimelineSection";
import { Week } from "./Week";

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

/** Short phrases as one sentence: "More than 440 moratoriums; power up 19% a year." */
function phrases(list: string[]) {
  const s = list.join("; ");
  return `${s[0].toUpperCase()}${s.slice(1)}.`;
}

/** "Nov 23 at 10:20:20 PM ET", the way CNN stamps the Fear & Greed Index. */
function formatUpdated(iso: string) {
  const d = new Date(iso);
  const et = { timeZone: "America/New_York" } as const;
  const day = d.toLocaleDateString("en-US", { ...et, month: "short", day: "numeric" });
  const time = d.toLocaleTimeString("en-US", { ...et, hour: "numeric", minute: "2-digit", second: "2-digit" });
  return `${day} at ${time} ET`;
}

export function Dashboard({ meta, tracks, daily, takeoff }: Dataset) {
  const series = { breakthroughs: makeSeries(tracks.breakthroughs, meta), releases: makeSeries(tracks.releases, meta) };
  const { score, zone, signals } = readIndex(takeoff, series);
  const b = series.breakthroughs;
  const years = TRACK_INFO.breakthroughs.baselineYears;
  const recent = countIn(b, b.asOf - 364, b.asOf);
  const before = countIn(b, b.asOf - (years + 1) * 365 + 1, b.asOf - 365);
  const releases = gaps(series.releases, TRACK_INFO.releases.baselineYears);
  const drivers = [
    `${recent} breakthroughs in the past year, against ${before} in the ${yearsWord(years)} years before`,
    ...(releases.recent && releases.before
      ? [`a frontier model every ${formatInterval(releases.recent)}, against every ${formatInterval(releases.before)}`]
      : []),
    ...takeoff.forces.up.map((f) => f.text),
  ];

  return (
    <Pages>
      <div className="cols">
        <section id="breakthroughs">
          <h2>Breakthroughs</h2>
          <p>
            Firsts for humankind made by AI: new science, math or medicine, or a historic first the whole world noticed.
          </p>
          <Events series={series.breakthroughs} />
        </section>

        <Week meta={meta} daily={daily} breakthroughs={tracks.breakthroughs} />

        <div>
          <section id="index">
            <div className="reading">
              <Gauge fraction={score / 100} value={String(Math.round(score))} zone={zone.name} />
            </div>
            <p>
              <b>{zone.name}.</b> {zone.means} By the five measures below, it is moving {paceFor(score)}.
            </p>
            <p className="updated">Last updated {formatUpdated(meta.updated)}</p>
            <p>
              <b>Drivers.</b> {phrases(drivers)}
            </p>
            <p>
              <b>Constraints.</b> {phrases(takeoff.forces.down.map((f) => f.text))}
            </p>
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
      </div>
    </Pages>
  );
}
