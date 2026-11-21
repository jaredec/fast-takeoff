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

- A breakthrough is something AI could not do before, shown in public for the first time, that clearly beats the previous best or opens a new category, and that people outside AI talked about. Funding, minor updates and hires don't count.
- A release is a new model from a major lab that people can use by app, API or open weights. New versions count; price cuts and renamed tiers don't.
- A model can be in both files when its launch was itself a breakthrough.
- Date an event by the day it was first shown or shipped in US time, not when coverage peaked.
- Never invent an event or a date. Leave a gap and mark the range in `meta.json` instead.
- `why` is one plain sentence a non-expert would understand.
- The timeline shows each event's logo, picked by `src/lib/logos.ts` from the title or org. A new lab needs its real mark in `public/logos`. An event with no company gets a pictogram through `image`. Never draw or invent a logo.
