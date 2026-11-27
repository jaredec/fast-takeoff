/** After a Claude run: drops the candidates it was given from the queue and counts the run toward today's cap. */
import { existsSync, readFileSync } from "node:fs";
import { etDay, readCandidates, readStatus, urlKey, writeCandidates, writeStatus, type Candidate } from "./state";

const snapshot = process.argv[2];
const handled = snapshot && existsSync(snapshot) ? (JSON.parse(readFileSync(snapshot, "utf8")) as Candidate[]) : [];
const keys = new Set(handled.map((c) => urlKey(c.url)));
writeCandidates(readCandidates().filter((c) => !keys.has(urlKey(c.url))));

const now = new Date();
const status = readStatus();
const today = etDay(now);
writeStatus({
  lastCurate: now.toISOString(),
  curateDay: today,
  curateRuns: (status.curateDay === today ? (status.curateRuns ?? 0) : 0) + 1,
});
console.log(`Settled ${handled.length} candidates.`);
