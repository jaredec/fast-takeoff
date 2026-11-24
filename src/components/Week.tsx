import type { Daily } from "@/lib/data";
import { formatDay, toDay, type AiEvent, type Meta } from "@/lib/metrics";

type Item = { date: string; title: string; org: string; why: string; url?: string; breakthrough?: boolean };

/** The seven days ending on the day of the last update, newest first, with that week's breakthroughs folded in. */
export function Week({ meta, daily, breakthroughs }: { meta: Meta; daily: Daily[]; breakthroughs: AiEvent[] }) {
  const end = toDay(meta.updated.slice(0, 10));
  const inWeek = (date: string) => toDay(date) > end - 7 && toDay(date) <= end;
  const items: Item[] = [
    ...breakthroughs.filter((b) => inWeek(b.date)).map((b) => ({ ...b, breakthrough: true })),
    ...daily.filter((d) => inWeek(d.date)),
  ];
  const days = [...new Set(items.map((e) => e.date))].sort().reverse();

  return (
    <section id="week">
      <h2>What did AI do today?</h2>
      <p>
        Everything notable AI achieved each day this past week, newest first: results, records, discoveries and firsts,
        each with its source. New models are on the timeline.
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
                    {e.url ? <a href={e.url} target="_blank" rel="noopener noreferrer">
                        {e.org}
                      </a> : e.org}
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
