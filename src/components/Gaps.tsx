import { formatInterval, gaps, TRACK_INFO, TRACKS, type Series, type Track } from "@/lib/metrics";

export function Gaps({ series }: { series: Record<Track, Series> }) {
  return (
    <section id="gaps">
      <h2>Time between</h2>
      <div className="gaps">
        {TRACKS.map((t) => {
          const g = gaps(series[t]);
          return (
            <div key={t} className="gap" data-track={t}>
              <p className="gap-label">{TRACK_INFO[t].label}</p>
              <p className="gap-value">{g.recent ? formatInterval(g.recent) : "—"}</p>
              <p className="gap-sub">between {TRACK_INFO[t].noun} over the last year</p>
              <dl>
                <div>
                  <dt>The five years before that</dt>
                  <dd>{g.before ? formatInterval(g.before) : "—"}</dd>
                </div>
                {g.latest !== null && (
                  <div>
                    <dt>Latest gap</dt>
                    <dd>{g.latest === 0 ? "Same day" : g.latest === 1 ? "1 day" : formatInterval(g.latest)}</dd>
                  </div>
                )}
              </dl>
            </div>
          );
        })}
      </div>
    </section>
  );
}
