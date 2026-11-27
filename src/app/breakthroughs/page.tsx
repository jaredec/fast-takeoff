import { loadDataset } from "@/lib/data";
import { formatDay, makeSeries } from "@/lib/metrics";

export default function Page() {
  const { meta, tracks } = loadDataset();
  const breakthroughs = makeSeries(tracks.breakthroughs, meta);

  return (
    <section id="breakthroughs">
      <p>Breakthroughs made or assisted by AI that changed what felt possible.</p>
      <ul>
        {[...breakthroughs.events].reverse().map((e) => (
          <li key={`${e.date} ${e.title}`}>
            <b>{e.title}.</b> {e.why}{" "}
            <i>
              {formatDay(e.day)},{" "}
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
        ))}
      </ul>
    </section>
  );
}
