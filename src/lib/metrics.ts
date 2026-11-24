export type Track = "breakthroughs" | "releases";
export const TRACKS: Track[] = ["breakthroughs", "releases"];

export type AiEvent = { date: string; title: string; org: string; why: string; field?: string; icon?: string; url?: string };
export type Meta = { asOf: string; updated: string; untracked: [string, string][] };
export type DayEvent = AiEvent & { day: number };

type TrackInfo = {
  label: string;
  noun: string;
  color: string;
  rgb: [number, number, number];
  /** Years before the last one that set its old pace. Releases start after ChatGPT, when labs began shipping frontier models to the public as a matter of course. */
  baselineYears: number;
};

export const TRACK_INFO: Record<Track, TrackInfo> = {
  breakthroughs: { label: "Breakthroughs", noun: "breakthroughs", color: "#5f9b65", rgb: [75, 143, 58], baselineYears: 5 },
  releases: { label: "Frontier releases", noun: "frontier releases", color: "#4a6fa5", rgb: [63, 99, 160], baselineYears: 3 },
};

export const yearsWord = (n: number) => ["", "one", "two", "three", "four", "five", "six"][n] ?? String(n);

export const DAY_MS = 864e5;
export const MONTH = 30.4375;
export const toDay = (iso: string) => Math.round(Date.parse(`${iso}T00:00:00Z`) / DAY_MS);
export const fromDay = (day: number) => new Date(day * DAY_MS);
export const isoDay = (day: number) => fromDay(day).toISOString().slice(0, 10);

const DEFAULT_FORMAT: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", year: "numeric" };
export function formatDay(day: number, options: Intl.DateTimeFormatOptions = DEFAULT_FORMAT) {
  return fromDay(day).toLocaleDateString("en-US", { ...options, timeZone: "UTC" });
}

export type Series = {
  events: DayEvent[];
  byDay: Map<number, DayEvent[]>;
  asOf: number;
  untracked: [number, number][];
};

export function makeSeries(events: AiEvent[], meta: Meta): Series {
  const sorted = events.map((e) => ({ ...e, day: toDay(e.date) })).sort((a, b) => a.day - b.day);
  const byDay = new Map<number, DayEvent[]>();
  for (const e of sorted) byDay.set(e.day, [...(byDay.get(e.day) ?? []), e]);
  return {
    events: sorted,
    byDay,
    asOf: toDay(meta.asOf),
    untracked: meta.untracked.map(([a, b]) => [toDay(a), toDay(b)]),
  };
}

export const isUntracked = (s: Series, day: number) => s.untracked.some(([a, b]) => day >= a && day <= b);

/** Days in [from, to] that have been curated. */
export function trackedDays(s: Series, from: number, to: number) {
  let n = to - from + 1;
  for (const [a, b] of s.untracked) {
    const lo = Math.max(from, a);
    const hi = Math.min(to, b);
    if (hi >= lo) n -= hi - lo + 1;
  }
  return n;
}

export function countIn(s: Series, from: number, to: number) {
  let n = 0;
  for (const e of s.events) if (e.day >= from && e.day <= to) n++;
  return n;
}

export type Rate = { perDay: number; count: number; days: number };

/** Events per tracked day over the window ending on `asOf`, or null when too little of it is tracked. */
export function rateAt(s: Series, asOf: number, window = 90): Rate | null {
  const from = asOf - window + 1;
  const days = trackedDays(s, from, asOf);
  if (days < 60) return null;
  const count = countIn(s, from, asOf);
  return { perDay: count / days, count, days };
}

export type Unit = "day" | "week" | "month";
export const UNITS: Record<Unit, number> = { day: 1, week: 7, month: MONTH };
export const isUnit = (u: string): u is Unit => u in UNITS;
export const isTrack = (t: string): t is Track => (TRACKS as string[]).includes(t);

export function formatRate(v: number) {
  if (v === 0) return "0";
  if (v >= 10) return v.toFixed(0);
  if (v >= 1) return v.toFixed(1);
  if (v >= 0.1) return v.toFixed(2);
  return v.toFixed(3);
}

/** "20 days", "4 months", "1.5 years". */
export function formatInterval(days: number) {
  if (days < 1.5) return "day";
  if (days < 60) return `${Math.round(days)} days`;
  if (days < 730) return `${Math.round(days / MONTH)} months`;
  return `${(days / 365.25).toFixed(days < 3650 ? 1 : 0)} years`;
}

/** Average days between events over the tracked days of [from, to], or null with fewer than two events. */
export function averageGap(s: Series, from: number, to: number) {
  const count = countIn(s, from, to);
  return count < 2 ? null : trackedDays(s, from, to) / count;
}

/** The average gap over the last year and over the `years` before it. */
export function gaps(s: Series, years: number) {
  const year = 365;
  return {
    recent: averageGap(s, s.asOf - year + 1, s.asOf),
    before: averageGap(s, s.asOf - (years + 1) * year + 1, s.asOf - year),
    latest: s.events.length > 1 ? s.events.at(-1)!.day - s.events.at(-2)!.day : null,
  };
}

export function countsByYear(s: Series, from: number, to: number) {
  const out: { year: number; count: number }[] = [];
  for (let y = from; y <= to; y++) {
    out.push({ year: y, count: countIn(s, toDay(`${y}-01-01`), Math.min(s.asOf, toDay(`${y}-12-31`))) });
  }
  return out;
}
