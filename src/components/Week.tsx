import type { Daily } from "@/lib/data";
import { formatDay, toDay, type AiEvent, type Meta } from "@/lib/metrics";

type Item = { date: string; title: string; org: string; why: string; url?: string; breakthrough?: boolean };

/** Everything from the seven days ending on the day of the last update, newest first, with that week's breakthroughs folded in. */
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
      <p>Everything notable AI accomplished this past week, newest first.</p>
      <ul>
        {days.flatMap((date) =>
          items
            .filter((e) => e.date === date)
            .map((e) => (
              <li key={e.title}>
                <b>{e.title}.</b> {e.why}{" "}
                <i>
                  {formatDay(toDay(e.date), { month: "long", day: "numeric" })},{" "}
                  {e.url ? (
                    <a href={e.url} target="_blank" rel="noopener noreferrer">
                      {e.org}
                    </a>
                  ) : (
                    e.org
                  )}
                  {e.breakthrough && " · Breakthrough"}.
                </i>
              </li>
            )),
        )}
      </ul>
    </section>
  );
}
