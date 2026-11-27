import { cacheLife } from "next/cache";
import type { Daily } from "@/lib/data";
import { formatDay, toDay, type AiEvent, type Meta } from "@/lib/metrics";

type Item = { date: string; title: string; org: string; why: string; field?: string; url?: string; breakthrough?: boolean };

/** Everything from the seven days ending today in US time (or the last update if older), newest first, excluding seven days ago. */
export async function Week({ meta, daily, breakthroughs }: { meta: Meta; daily: Daily[]; breakthroughs: AiEvent[] }) {
  "use cache";
  cacheLife("hours");

  const all: Item[] = [
    ...breakthroughs.map((b) => ({ ...b, breakthrough: true })),
    ...daily,
  ];
  const updatedDay = toDay(meta.updated.slice(0, 10));
  const nowDay = toDay(new Date().toLocaleDateString("en-CA", { timeZone: "America/New_York" }));
  const candidate = Math.max(updatedDay, nowDay);
  const inWindow = (end: number) => all.filter((e) => toDay(e.date) > end - 7 && toDay(e.date) <= end);
  const items = inWindow(candidate).length > 0 ? inWindow(candidate) : inWindow(updatedDay);
  const days = [...new Set(items.map((e) => e.date))].sort().reverse();

  return (
    <section id="week">
      <p>A running log of the most ambitious things AI did this past week.</p>
      <ul>
        {days.flatMap((date) =>
          items
            .filter((e) => e.date === date)
            .map((e) => (
              <li key={e.title} className={e.breakthrough ? "star" : undefined}>
                {e.breakthrough && <Star />}
                <b>{e.title}.</b> {e.why}{" "}
                <i>
                  {e.field && `${e.field[0].toUpperCase() + e.field.slice(1)}, `}
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
