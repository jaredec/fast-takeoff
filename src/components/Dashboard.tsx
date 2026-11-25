import type { Dataset } from "@/lib/data";
import { formatDay, makeSeries, type Series } from "@/lib/metrics";
import { Pages } from "./Pages";
import { Problems } from "./Problems";
import { Week } from "./Week";

function Events({ series }: { series: Series }) {
  return (
    <ul>
      {[...series.events].reverse().map((e) => (
        <li key={`${e.date} ${e.title}`}>
          <b>{e.title}.</b> {e.why}{" "}
          <i>
            {e.org}, {formatDay(e.day)}.
          </i>
        </li>
      ))}
    </ul>
  );
}

export function Dashboard({ meta, tracks, daily, problems }: Dataset) {
  const breakthroughs = makeSeries(tracks.breakthroughs, meta);

  return (
    <Pages>
      <div className="cols">
        <Week meta={meta} daily={daily} breakthroughs={tracks.breakthroughs} />

        <section id="breakthroughs">
          <p>Firsts for humankind by people working with AI.</p>
          <Events series={breakthroughs} />
        </section>

        <Problems problems={problems} />
      </div>
    </Pages>
  );
}
