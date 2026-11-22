import type { CSSProperties } from "react";
import type { Series, Track } from "@/lib/metrics";
import { formatTimes, PACE_PER_ZONE, readIndex, zoneFor, type Takeoff } from "@/lib/takeoff";
import { Gauge } from "./Gauge";

export function Index({ takeoff, series }: { takeoff: Takeoff; series: Record<Track, Series> }) {
  const { score, zone, signals } = readIndex(takeoff, series);
  const value = Math.round(score);
  return (
    <section id="index">
      <h2>The Fast Takeoff Index</h2>
      <div className="index">
        <Gauge fraction={score / 100} value={String(value)} zone={zone.name} />
        <div>
          <p className="kicker">How fast AI is moving, out of 100</p>
          <p className="big">{value}</p>
          <p className="zone" style={{ "--zc": zone.color } as CSSProperties}>
            <i />
            {zone.name}
          </p>
        </div>
      </div>

      <ol className="signals">
        {signals.map((s) => {
          const z = zoneFor(s.score);
          return (
            <li key={s.name} style={{ "--zc": z.color } as CSSProperties}>
              <div>
                <p className="signal-name">
                  {s.name}
                  <a href={s.url}>{s.source}</a>
                </p>
                <p className="signal-now">{s.now}</p>
                <p className="signal-was">
                  Was {s.was} · {s.pace ?? `${formatTimes(s.speed)} the old pace`}
                </p>
              </div>
              <div className="signal-score">
                <b>{Math.round(s.score)}</b>
                <span>
                  <i style={{ width: `${s.score}%` }} />
                </span>
                <small>{z.name}</small>
              </div>
            </li>
          );
        })}
      </ol>

      <p className="note">
        Each signal scores 50 when it moves at its old pace, 75 at {PACE_PER_ZONE} times that pace and 25 at{" "}
        {PACE_PER_ZONE} times slower. The index is their plain average, the way CNN&rsquo;s{" "}
        <a href="https://www.cnn.com/markets/fear-and-greed">Fear &amp; Greed Index</a> averages seven market signals.
        The figures are copied from each source&rsquo;s latest update; the forecasters&rsquo; earlier date is from{" "}
        <a href={takeoff.metaculus.before.url}>Intelligence Progress</a>.
      </p>
    </section>
  );
}
