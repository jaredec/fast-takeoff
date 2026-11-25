import { loadDataset } from "@/lib/data";
import { formatDay, makeSeries } from "@/lib/metrics";

export default function Page() {
  const { meta, tracks } = loadDataset();
  const breakthroughs = makeSeries(tracks.breakthroughs, meta);

  return (
    <section id="breakthroughs">
      <p>Firsts for humankind by people working with AI.</p>
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
