<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## whataididtoday.com

This repo used to be Capsule. Capsule now lives in `jaredec/capsule` (its own Vercel project, served at jaredconnolly.com/capsule); don't build on it here.

The site is live at whataididtoday.com (with www redirecting to it), linked from the jaredconnolly.com homepage.

## Open problems

The "Open problems" page is our own ranking of open problems in each science (`SCIENCES` in `src/lib/logos.ts`) that are within reach, most important first, in `data/problems.json`. Each is a concrete goal with a clear finish line, like a math conjecture or "net electricity from fusion", never an open-ended mystery ("origin of life", "consciousness", "patterns in pi"). Choose and order them ourselves; don't copy another list, and check a goal hasn't already been reached before adding it. Mark one `Solved` or `Disproved` only with a link to the announcement or proof for each credited lab or person; solved problems keep their place.

## The index

The Singularity Index and Timeline pages are hidden for now, to be refined later; their code and data stay in the repo.

The Singularity Index is our own 0–100 estimate, built like CNN's Fear & Greed Index: each signal scores 50 at its old pace and 25 points more for every eightfold speedup, and the index is their plain average (`readIndex` in `src/lib/takeoff.ts`). The signals are METR's time horizon doubling time, Epoch AI's Capabilities Index trend, the Metaculus community date for general AI, and the average gap between breakthroughs and between frontier releases from our own data.

Under the dial, "Drivers" and "Constraints" are one short line each on what is pushing the pace each way right now (`forces` in `data/takeoff.json`, plus the breakthrough and release counts): brief, neutral phrases joined by semicolons, each stored with its source, link and date though the page doesn't show them. Replace stale ones as news changes, keep both sides honest, and never invent one.

The sourced figures live in `data/takeoff.json`, copied from each source's latest update with its date and link. Update them when a source publishes, never estimate them. For Metaculus, record the date you read the median and keep a reading from about a year earlier in `before`.

## Curating events

Events live in `data/breakthroughs.json` and `data/releases.json`. `data/meta.json` sets the last curated day (`asOf`), when the data last changed (`updated`, an ISO time with its offset, shown under the dial as "Last updated" in ET) and the ranges not backfilled yet. Set `updated` to the current time whenever you change anything in `data/`. Run `npm run validate-data` after any edit.

- A breakthrough is a first for humankind made or assisted by AI: new science, math or medicine (protein folding, a new antibiotic, a solved open problem), or a historic first the whole world noticed (Deep Blue, AlexNet, AlphaGo). Model launches, products, benchmarks and demos are never breakthroughs, however impressive.
- A release is a frontier release: a lab's new most capable model, shipped so people can use it by app, API or open weights (GPT-5, Claude Fable 5.2, Gemini 4 Carbon). Cheaper or smaller tiers (Flash under a newer Pro, Sonnet under Opus, mini models), image, video and voice models, coding spin-offs and apps don't count. Date it by the day people could first use it.
- Date an event by the day it was first shown or shipped in US time, not when coverage peaked.
- Never invent an event or a date. Leave a gap and mark the range in `meta.json` instead.
- A breakthrough's `title` names its subject, the way Patrick Collison's Fast page names a project ("COVID-19 vaccines"): "Protein folding", "Riemann hypothesis". Not a headline ("Protein folding solved"), not "AI did X", not a version name ("AlphaFold 3"). An iconic system can be the subject ("Deep Blue", "AlexNet"). The `why` says what happened and names the system.
- `why` reads like a knowledgeable colleague's research digest: one or two short present-tense sentences saying what was shown in the field's own terms, who did it, and the previous best when that is what makes the result legible ("the matrix multiplication exponent is exactly 9/4"). Keep the terms as simple as they allow but never dumb them down, and leave out raw notation like big-O or exponents. No hooks, questions, framing or wonder; the sentences vary because the results differ. Don't join clauses with ", and"; use a semicolon, "then" or "with" instead. Don't hedge: treat a result as real unless it's shown to be wrong or a hoax, so no "experts are still checking", "no one has checked it yet" or "X says".
- Credit people by name the way the sources do: the person who did the work alongside the AI ("mathematician Levent Alpöge"), or the one to three people a paper or prize credits ("led by John Jumper and Demis Hassabis"). Never "a mathematician" when the source names them. Leave large teams with no standout unnamed, and never guess a name.
- Every breakthrough has a `field` (see `FIELDS` in `src/lib/logos.ts`) and its own `icon`: a Lucide or Tabler icon that fits that breakthrough (a Go board for AlphaGo), saved as `public/logos/bt-<icon>.svg` in the field's color from `FIELD_COLORS`. No two breakthroughs share an icon.
- Releases show their lab's logo, picked by `src/lib/logos.ts` from the title or org. A new lab needs its real mark in `public/logos`. Never draw or invent a logo.
- `data/daily.json` feeds "What did AI do today?": everything notable AI itself achieved each day, at a lower bar than a breakthrough. New results (proofs, solved problems including single Erdős problems a credible mathematician vouches for, discoveries, designed and tested drugs or materials), real-world firsts and records with a hard number, and things agents did on their own that drew wide attention. Not funding, lawsuits, policy, hires, product features, partnerships or model releases (those go in `releases.json`), and no rumors. Same style as breakthroughs (subject `title`, one plain present-tense `why` crediting people by name), plus a `url` to the source: the announcement or the proof itself (the paper, preprint, repository or the team's own post), never news coverage. Breakthroughs from the same days appear on the page on their own, so don't repeat them here; give each of them a `url` the same way. Dates can run past `asOf` up to the day of `updated`. The page shows the seven days ending on the day of `updated`; keep older entries in the file.
