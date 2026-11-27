import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

/** Finder state lives on the `finder` branch, checked out at STATE_DIR, so hourly runs never touch main. */
export const STATE_DIR = process.env.STATE_DIR ?? ".finder-state";

export type Candidate = {
  url: string;
  title: string;
  note: string;
  source: string;
  foundAt: string;
  urgent: boolean;
};

export type Status = {
  lastCurate?: string;
  curateDay?: string;
  curateRuns?: number;
};

function read<T>(name: string, fallback: T): T {
  const file = path.join(STATE_DIR, name);
  return existsSync(file) ? (JSON.parse(readFileSync(file, "utf8")) as T) : fallback;
}

function write(name: string, value: unknown) {
  mkdirSync(STATE_DIR, { recursive: true });
  writeFileSync(path.join(STATE_DIR, name), JSON.stringify(value, null, 2) + "\n");
}

export const readSeen = () => read<Record<string, string>>("seen.json", {});
export const writeSeen = (v: Record<string, string>) => write("seen.json", v);
export const readCandidates = () => read<Candidate[]>("candidates.json", []);
export const writeCandidates = (v: Candidate[]) => write("candidates.json", v);
export const readStatus = () => read<Status>("status.json", {});
export const writeStatus = (v: Status) => write("status.json", v);
export const readPosted = () => read<string[]>("posted.json", []);
export const writePosted = (v: string[]) => write("posted.json", v);

/** Same page, however it was linked: no scheme, www, trailing slash, fragment or tracking query. */
export function urlKey(url: string) {
  try {
    const u = new URL(url);
    for (const p of [...u.searchParams.keys()]) if (/^(utm_|ref$|s$|t$)/.test(p)) u.searchParams.delete(p);
    const host = u.hostname.replace(/^www\./, "");
    const pathname = u.pathname.replace(/\/+$/, "").replace(/^\/abs\/(\d{4}\.\d{4,5})v\d+$/, "/abs/$1");
    return `${host}${pathname}${u.search}`.toLowerCase();
  } catch {
    return url.trim().toLowerCase();
  }
}

/** The calendar day in US Eastern time, which the site uses for "today". */
export const etDay = (d = new Date()) => d.toLocaleDateString("en-CA", { timeZone: "America/New_York" });

export function setOutput(name: string, value: string) {
  const file = process.env.GITHUB_OUTPUT;
  if (file) writeFileSync(file, `${name}=${value}\n`, { flag: "a" });
  console.log(`${name}=${value}`);
}
