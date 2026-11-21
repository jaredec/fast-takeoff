import { existsSync } from "node:fs";
import { loadDataset } from "../src/lib/data";
import { logosFor } from "../src/lib/logos";
import { TRACKS, toDay } from "../src/lib/metrics";

const { meta, tracks } = loadDataset();
const asOf = toDay(meta.asOf);
const untracked = meta.untracked.map(([a, b]) => [toDay(a), toDay(b)] as const);
const problems: string[] = [];
const icons = new Set<string>();

for (const [a, b] of untracked) if (a > b) problems.push(`meta: untracked range ${a} is backwards`);

for (const track of TRACKS) {
  const seen = new Set<string>();
  for (const e of tracks[track]) {
    const day = toDay(e.date);
    const where = `${track}: ${e.date} ${e.title}`;
    if (Number.isNaN(day)) problems.push(`${where}: invalid date`);
    if (day > asOf) problems.push(`${where}: after asOf ${meta.asOf}`);
    if (untracked.some(([a, b]) => day >= a && day <= b)) problems.push(`${where}: inside an untracked range`);
    if (track === "breakthroughs" && !e.field) problems.push(`${where}: needs a "field"`);
    if (track === "breakthroughs" && !e.icon) problems.push(`${where}: needs an "icon"`);
    if (e.icon && !existsSync(`public/logos/bt-${e.icon}.svg`)) problems.push(`${where}: no public/logos/bt-${e.icon}.svg`);
    if (e.icon && icons.has(e.icon)) problems.push(`${where}: icon "${e.icon}" is already used`);
    if (e.icon) icons.add(e.icon);
    if (!logosFor(e).length) problems.push(`${where}: no logo for "${e.org}"; add one to src/lib/logos.ts`);
    const key = `${e.date}|${e.title}`;
    if (seen.has(key)) problems.push(`${where}: duplicate`);
    seen.add(key);
  }
}

if (problems.length) {
  console.error(problems.join("\n"));
  process.exit(1);
}
console.log(`ok: ${TRACKS.map((t) => `${tracks[t].length} ${t}`).join(", ")}, as of ${meta.asOf}`);
