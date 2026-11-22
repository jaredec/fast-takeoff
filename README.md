# Fast Takeoff

How fast is AI moving? A daily index of AI breakthroughs and model releases, served at [jaredconnolly.com/fasttakeoff](https://www.jaredconnolly.com/fasttakeoff).

- `data/breakthroughs.json` and `data/releases.json` hold the events. `data/meta.json` holds the last curated day and the ranges not backfilled yet.
- The page shows the index (METR's time horizon doubling time, from `data/takeoff.json`), the average time between events on each track over the last year against the five years before, and a timeline of each track at true time scale from AlexNet, with a list of the events in the chosen range.
- Cards for the daily post on X are generated at `/fasttakeoff/card/<breakthroughs|releases>/<day|week|month>`.
- `public/logos` holds the marks on the timeline: lab logos from [LobeHub Icons](https://github.com/lobehub/lobe-icons) (MIT) and breakthrough icons from [Lucide](https://lucide.dev) (ISC) and [Tabler Icons](https://tabler.io/icons) (MIT). The logos are their owners' trademarks.

```sh
npm run dev            # http://localhost:3000/fasttakeoff
npm run validate-data
npm run lint && npm run typecheck
```

Capsule, the project this repo used to hold, is archived on the `archive/capsule` branch.
