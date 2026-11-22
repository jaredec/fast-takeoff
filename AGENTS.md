<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Fast Takeoff

This repo used to be Capsule. Capsule is archived on the `archive/capsule` branch and the `capsule-final` tag; don't build on it here.

The site is served at jaredconnolly.com/fasttakeoff through a routing rule on the `jaredconnolly-com` Vercel project that rewrites to this project's production domain.

## Curating events

Events live in `data/breakthroughs.json` and `data/releases.json`. `data/meta.json` sets the last curated day (`asOf`) and the ranges not backfilled yet. Run `npm run validate-data` after any edit.

- A breakthrough is a first for humankind made by AI: new science, math or medicine (protein folding, a new antibiotic, a solved open problem), or a historic first the whole world noticed (Deep Blue, AlexNet, AlphaGo). Model launches, products, benchmarks and demos are never breakthroughs, however impressive.
- A release is a new model or AI product from a major lab that people can use by app, API or open weights (GPT-5, Claude Code, Deep Research). New versions count; price cuts and renamed tiers don't.
- Date an event by the day it was first shown or shipped in US time, not when coverage peaked.
- Never invent an event or a date. Leave a gap and mark the range in `meta.json` instead.
- A breakthrough's `title` names the breakthrough itself in plain words ("Protein folding solved", "Riemann hypothesis proved"), never just the system ("AlphaFold 3"). Name the system in `why`.
- `why` is one plain sentence a non-expert would understand.
- Every breakthrough has a `field` (see `FIELDS` in `src/lib/logos.ts`) and its own `icon`: a Lucide or Tabler icon that fits that breakthrough (a Go board for AlphaGo), saved as `public/logos/bt-<icon>.svg` in the field's color from `FIELD_COLORS`. No two breakthroughs share an icon.
- Releases show their lab's logo, picked by `src/lib/logos.ts` from the title or org. A new lab needs its real mark in `public/logos`. Never draw or invent a logo.
