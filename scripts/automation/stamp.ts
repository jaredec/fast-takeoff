/** Sets data/meta.json `updated` to now (Pacific time, with its offset) and `asOf` to today, as AGENTS.md asks. */
import { readFileSync, writeFileSync } from "node:fs";

const now = new Date();
const parts = Object.fromEntries(
  new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Los_Angeles",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
    timeZoneName: "longOffset",
  })
    .formatToParts(now)
    .map((p) => [p.type, p.value]),
);
const offset = parts.timeZoneName.replace("GMT", "") || "+00:00";
const day = `${parts.year}-${parts.month}-${parts.day}`;

const meta = JSON.parse(readFileSync("data/meta.json", "utf8"));
meta.updated = `${day}T${parts.hour}:${parts.minute}:${parts.second}${offset}`;
if (day > meta.asOf) meta.asOf = day;
writeFileSync("data/meta.json", JSON.stringify(meta, null, 2) + "\n");
console.log(`meta: updated ${meta.updated}, asOf ${meta.asOf}`);
