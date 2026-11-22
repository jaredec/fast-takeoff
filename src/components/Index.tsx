import type { CSSProperties } from "react";
import { formatDay, toDay } from "@/lib/metrics";
import { BASELINE_MONTHS, formatMonths, gaugeFraction, zoneFor, type Takeoff } from "@/lib/takeoff";
import { Gauge } from "./Gauge";

export function Index({ takeoff: t }: { takeoff: Takeoff }) {
  const zone = zoneFor(t.doublingMonths);
  const months = formatMonths(t.doublingMonths);
  return (
    <section id="index">
      <h2>The Fast Takeoff Index</h2>
      <div className="index">
        <Gauge fraction={gaugeFraction(t.doublingMonths)} value={months} zone={zone.name} />
        <div>
          <p className="kicker mono">The length of task AI can finish alone doubles every</p>
          <p className="big">{months}</p>
          <p className="unitline">months</p>
          <p className="zone" style={{ "--zc": zone.color } as CSSProperties}>
            <i />
            {zone.name}
          </p>
        </div>
      </div>
      <p className="note">
        From{" "}
        <a href={t.url}>
          {t.source}&rsquo;s {formatDay(toDay(t.date), { month: "short", day: "numeric", year: "numeric" })} update
        </a>
        , likely between {formatMonths(t.low)} and {formatMonths(t.high)} months. From 2019 to 2024 it doubled every{" "}
        {BASELINE_MONTHS} months. The best public model, {t.frontier.model}, now finishes about half of tasks that take a
        skilled person {t.frontier.hours} hours.
      </p>
    </section>
  );
}
