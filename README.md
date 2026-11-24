# Fast Takeoff

How fast is AI moving? A daily index of AI breakthroughs and model releases, served at [jaredconnolly.com/fasttakeoff](https://www.jaredconnolly.com/fasttakeoff).

- `data/breakthroughs.json` and `data/releases.json` hold the events. `data/meta.json` holds the last curated day and the ranges not backfilled yet.
- The page shows the Fast Takeoff Index (a 0–100 average of METR's time horizon trend, Epoch AI's Capabilities Index, the Metaculus date for general AI and the gaps between events, with sourced figures in `data/takeoff.json`), the average time between events on each track over the last year against the five years before, and every breakthrough and frontier release, newest first. The index dial sits beside its reading, a timeline of every event runs across the page, and the text is styled after Patrick Collison's [Fast](https://patrickcollison.com/fast) page.
- Cards for the daily post on X are generated at `/fasttakeoff/card/<breakthroughs|releases>/<day|week|month>`.
- `public/logos` holds the mark each event shows on the timeline: lab logos from [LobeHub Icons](https://github.com/lobehub/lobe-icons) (MIT) and breakthrough icons from [Lucide](https://lucide.dev) (ISC) and [Tabler Icons](https://tabler.io/icons) (MIT). The logos are their owners' trademarks.

```sh
npm run dev            # http://localhost:3000/fasttakeoff
npm run validate-data
npm run lint && npm run typecheck
```

Capsule, the project this repo used to hold, is archived on the `archive/capsule` branch.
