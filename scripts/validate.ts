import { existsSync } from "node:fs";
import { loadDataset } from "../src/lib/data";
import { logosFor, SCIENCES } from "../src/lib/logos";
import { TRACKS, toDay } from "../src/lib/metrics";

const { meta, tracks, daily, problems: openProblems, takeoff } = loadDataset();
const asOf = toDay(meta.asOf);
const untracked = meta.untracked.map(([a, b]) => [toDay(a), toDay(b)] as const);
const problems: string[] = [];
const icons = new Set<string>();

for (const [a, b] of untracked) if (a > b) problems.push(`meta: untracked range ${a} is backwards`);
const { metr, epoch, metaculus } = takeoff;
if (!(metr.lowMonths <= metr.doublingDays / 30.44 && metr.doublingDays / 30.44 <= metr.highMonths))
  problems.push("takeoff: metr.doublingDays must sit between lowMonths and highMonths");
if (!(epoch.low <= epoch.perYear && epoch.perYear <= epoch.high))
  problems.push("takeoff: epoch.perYear must sit between low and high");
if (toDay(metaculus.before.read) >= toDay(metaculus.now.read))
  problems.push("takeoff: metaculus.before must be read before metaculus.now");

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

const today = toDay(meta.updated.slice(0, 10));
const seen = new Set<string>();
for (const e of daily) {
  const day = toDay(e.date);
  const where = `daily: ${e.date} ${e.title}`;
  if (Number.isNaN(day)) problems.push(`${where}: invalid date`);
  if (day > today) problems.push(`${where}: after the last update, ${meta.updated}`);
  if (tracks.breakthroughs.some((b) => b.date === e.date && b.title === e.title))
    problems.push(`${where}: already a breakthrough that day, which the page adds on its own`);
  const key = `${e.date}|${e.title}`;
  if (seen.has(key)) problems.push(`${where}: duplicate`);
  seen.add(key);
}

for (const field of SCIENCES) {
  const list = openProblems.filter((p) => p.field === field);
  if (list.length < 15) problems.push(`problems: ${field} has only ${list.length}`);
  if (new Set(list.map((p) => p.title)).size !== list.length) problems.push(`problems: ${field} has a duplicate`);
}
for (const p of openProblems)
  if (!p.status !== !p.by) problems.push(`problems: ${p.title} needs both a status and who solved it, or neither`);

if (problems.length) {
  console.error(problems.join("\n"));
  process.exit(1);
}
console.log(`ok: ${TRACKS.map((t) => `${tracks[t].length} ${t}`).join(", ")}, ${daily.length} daily, as of ${meta.asOf}`);
