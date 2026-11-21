# Fast Takeoff

How fast is AI moving? A daily index of AI breakthroughs and model releases, served at [jaredconnolly.com/fasttakeoff](https://www.jaredconnolly.com/fasttakeoff).

- `data/breakthroughs.json` and `data/releases.json` hold the events. `data/meta.json` holds the last curated day and the ranges not backfilled yet.
- The page shows the index (breakthroughs a month over the trailing 90 days), a timeline of each track, the speed over time, a day-by-day grid, and the card for the daily post on X.
- Cards are generated at `/fasttakeoff/card/<breakthroughs|releases>/<day|week|month>`.

```sh
npm run dev            # http://localhost:3000/fasttakeoff
npm run validate-data
npm run lint && npm run typecheck
```

Capsule, the project this repo used to hold, is archived on the `archive/capsule` branch.
