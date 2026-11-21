import { loadDataset } from "../src/lib/data";
import { TRACKS, toDay } from "../src/lib/metrics";

const { meta, tracks } = loadDataset();
const asOf = toDay(meta.asOf);
const untracked = meta.untracked.map(([a, b]) => [toDay(a), toDay(b)] as const);
const problems: string[] = [];

for (const [a, b] of untracked) if (a > b) problems.push(`meta: untracked range ${a} is backwards`);

for (const track of TRACKS) {
  const seen = new Set<string>();
  for (const e of tracks[track]) {
    const day = toDay(e.date);
    const where = `${track}: ${e.date} ${e.title}`;
    if (Number.isNaN(day)) problems.push(`${where}: invalid date`);
    if (day > asOf) problems.push(`${where}: after asOf ${meta.asOf}`);
    if (untracked.some(([a, b]) => day >= a && day <= b)) problems.push(`${where}: inside an untracked range`);
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
