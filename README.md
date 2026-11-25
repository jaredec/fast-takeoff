# Fast Takeoff

How fast is AI moving? A daily index of AI breakthroughs and model releases, served at [whataididtoday.com](https://whataididtoday.com).

- `data/breakthroughs.json` and `data/releases.json` hold the events. `data/meta.json` holds the last curated day and the ranges not backfilled yet.
- The page shows the Singularity Index (a 0–100 average of METR's time horizon trend, Epoch AI's Capabilities Index, the Metaculus date for general AI and the gaps between events, with sourced figures in `data/takeoff.json`), the average time between events on each track over the last year against the five years before, and every breakthrough, newest first. It is split into four pages, What did AI do today? first (everything notable AI achieved each day over the past week, newest first, from `data/daily.json`), then Breakthroughs, Singularity Index and Timeline, picked from a nav on the right (across the top on phones), with the timeline running down the page, newest first, in text styled after Patrick Collison's [Fast](https://patrickcollison.com/fast) page.
- Cards for the daily post on X are generated at `/card/<breakthroughs|releases>/<day|week|month>`.
- `public/logos` holds the mark each event shows on the timeline: lab logos from [LobeHub Icons](https://github.com/lobehub/lobe-icons) (MIT) and breakthrough icons from [Lucide](https://lucide.dev) (ISC) and [Tabler Icons](https://tabler.io/icons) (MIT). The logos are their owners' trademarks.

```sh
npm run dev            # http://localhost:3000
npm run validate-data
npm run lint && npm run typecheck
```

Capsule, the project this repo used to hold, is archived on the `archive/capsule` branch.
