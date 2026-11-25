import { loadDataset } from "@/lib/data";
import { formatDay, makeSeries } from "@/lib/metrics";

export default function Page() {
  const { meta, tracks } = loadDataset();
  const breakthroughs = makeSeries(tracks.breakthroughs, meta);

  return (
    <section id="breakthroughs">
      <p>Moments when AI, alone or with people, expanded what seemed possible.</p>
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
