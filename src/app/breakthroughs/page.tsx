import { loadDataset } from "@/lib/data";
import { formatDay, makeSeries } from "@/lib/metrics";

export default function Page() {
  const { meta, tracks } = loadDataset();
  const breakthroughs = makeSeries(tracks.breakthroughs, meta);

  return (
    <section id="breakthroughs">
      <p>Breakthroughs made or assisted by AI that changed what was possible.</p>
      <ul>
        {[...breakthroughs.events].reverse().map((e) => (
          <li key={`${e.date} ${e.title}`}>
            <b>{e.title}.</b> {e.why}{" "}
            <i>
              {e.org}, {formatDay(e.day)}.
            </i>
          </li>
        ))}
      </ul>
    </section>
  );
}
