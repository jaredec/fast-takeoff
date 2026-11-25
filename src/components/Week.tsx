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
      <p>Ambitious things AI accomplished this past week.</p>
      <ul>
        {days.flatMap((date) =>
          items
            .filter((e) => e.date === date)
            .map((e) => (
              <li key={e.title} className={e.breakthrough ? "star" : undefined}>
                {e.breakthrough && <Star />}
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
                  .
                </i>
              </li>
            )),
        )}
      </ul>
    </section>
  );
}

/** A hand-drawn star that takes the place of the bullet for breakthroughs. */
function Star() {
  return (
    <svg className="star" viewBox="0 0 24 24" role="img" aria-label="Breakthrough">
      <title>Breakthrough</title>
      <path d="M12.6 1.8Q15.4 10.8 19.2 21.2Q10.2 16.4 2.2 9.8Q12.4 10.6 22 8.4Q13.2 15.6 4.8 20.6Q8.4 10.4 13.4 1.2" />
    </svg>
  );
}
