import type { Daily } from "@/lib/data";
import { formatDay, toDay, type AiEvent } from "@/lib/metrics";

type Item = { date: string; title: string; org: string; why: string; url?: string; breakthrough?: boolean };

/** The daily log, newest day first, with any breakthroughs from those days folded in. */
export function Today({ daily, breakthroughs }: { daily: Daily[]; breakthroughs: AiEvent[] }) {
  const since = daily.reduce((min, d) => (d.date < min ? d.date : min), daily[0]?.date ?? "9999");
  const items: Item[] = [
    ...daily,
    ...breakthroughs.filter((b) => b.date >= since).map((b) => ({ ...b, breakthrough: true })),
  ];
  const days = [...new Set(items.map((e) => e.date))].sort().reverse();

  return (
    <section id="today">
      <h2>What did AI do today</h2>
      <p>
        Everything notable AI achieved, day by day: results, records, discoveries and firsts, each with its source.
        New models are on the timeline.
      </p>
      {days.map((date) => (
        <div key={date}>
          <h3>{formatDay(toDay(date), { weekday: "long", month: "long", day: "numeric" })}</h3>
          <ul>
            {items
              .filter((e) => e.date === date)
              .map((e) => (
                <li key={e.title}>
                  <b>{e.title}.</b> {e.why}{" "}
                  <i>
                    {e.url ? <a href={e.url}>{e.org}</a> : e.org}
                    {e.breakthrough && " · Breakthrough"}.
                  </i>
                </li>
              ))}
          </ul>
        </div>
      ))}
    </section>
  );
}
