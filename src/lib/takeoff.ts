import { z } from "zod";
import data from "../../data/takeoff.json";
import { formatDay, formatInterval, gaps, toDay, TRACK_INFO, yearsWord, type Series, type Track } from "./metrics";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const reading = z.object({ read: isoDate, median: isoDate });
const force = z.object({ text: z.string().min(1), source: z.string().min(1), url: z.url(), date: isoDate });

/** Figures copied from each source's latest update. The index combines them; it never edits them. */
export const takeoffSchema = z.object({
  metr: z.object({
    source: z.string().min(1),
    url: z.url(),
    date: isoDate,
    /** METR publishes both trends in days; the interval only in months. */
    doublingDays: z.number().positive(),
    lowMonths: z.number().positive(),
    highMonths: z.number().positive(),
    baselineDays: z.number().positive(),
    baselineUrl: z.url(),
    frontier: z.object({ model: z.string().min(1), hours: z.number().positive() }),
  }),
  epoch: z.object({
    source: z.string().min(1),
    url: z.url(),
    date: isoDate,
    perYear: z.number().positive(),
    low: z.number().positive(),
    high: z.number().positive(),
    baselinePerYear: z.number().positive(),
  }),
  metaculus: z.object({
    source: z.string().min(1),
    url: z.url(),
    now: reading,
    before: reading.extend({ url: z.url() }),
  }),
  /** What's pushing the pace up and holding it back right now, one sourced line each. */
  forces: z.object({
    up: z.array(force),
    down: z.array(force),
  }),
});
export type Takeoff = z.infer<typeof takeoffSchema>;

export const loadTakeoff = (): Takeoff => takeoffSchema.parse(data);

/** How many times faster than its baseline a signal must move to climb one zone. */
export const PACE_PER_ZONE = 8;

/**
 * 50 is the old pace on every signal, and Steady is within about 1.5 times of it either way (45–55, like
 * Fear & Greed's Neutral). The extremes are narrow: Singularity needs about 28 times the old pace on
 * average (90), AI winter about 28 times slower (10).
 */
export const ZONES = [
  { name: "AI winter", from: 0, to: 10, color: "#9db3c9", means: "AI, and the work done by AI, has all but stopped improving." },
  { name: "Slow takeoff", from: 10, to: 45, color: "#8fbc9a", means: "AI, and the work done by AI, keeps improving, but more slowly than it used to." },
  { name: "Steady", from: 45, to: 55, color: "#e2c06a", means: "AI, and the work done by AI, is improving at about the pace it used to." },
  { name: "Fast takeoff", from: 55, to: 90, color: "#df7a45", means: "AI, and the work done by AI, is improving faster than it used to." },
  { name: "Singularity", from: 90, to: 100, color: "#b8392c", means: "AI, and the work done by AI, is improving dozens of times faster than it used to." },
] as const;
export type Zone = (typeof ZONES)[number];

export const zoneFor = (score: number): Zone => ZONES.find((z) => score < z.to) ?? ZONES[ZONES.length - 1];

/** The average pace a score stands for, against the old pace: 63 is about 3 times, 37 about 1/3. */
export function paceFor(score: number) {
  const f = PACE_PER_ZONE ** ((score - 50) / 25);
  if (f >= 1.25) return `about ${f < 2 ? f.toFixed(1) : Math.round(f)} times its earlier pace`;
  if (f > 0.8) return "about its earlier pace";
  return f > 0.4 ? "about half its earlier pace" : `about 1/${Math.round(1 / f)} of its earlier pace`;
}

/** 0–100 from how many times faster than its baseline a signal moves: 1× is 50, 8× is 75, 1/8× is 25. */
export const scoreFor = (speed: number) =>
  Math.min(100, Math.max(0, 50 + (25 * Math.log(Math.max(speed, 1e-6))) / Math.log(PACE_PER_ZONE)));

export type Signal = {
  name: string;
  /** What the source says now, in plain words. */
  now: string;
  /** The baseline it is compared with. */
  was: string;
  /** How its speed reads, when "N× the old pace" doesn't fit. */
  pace?: string;
  source: string;
  url: string;
  speed: number;
  score: number;
};

const YEAR = 365.25;
const month = (iso: string) => formatDay(toDay(iso), { month: "short", year: "numeric" });
export const formatTimes = (x: number) => `${x >= 10 ? x.toFixed(0) : x.toFixed(1)}×`;

/** The Singularity Index: the plain average of each signal's score, like the Fear & Greed Index. */
export function readIndex(t: Takeoff, series: Record<Track, Series>) {
  const signal = (s: Omit<Signal, "score">): Signal => ({ ...s, score: scoreFor(s.speed) });
  const signals: Signal[] = [
    signal({
      name: "Task length",
      now: `The length of task AI can finish alone doubles every ${t.metr.doublingDays} days`,
      was: `${t.metr.baselineDays} days from 2019 to early 2025`,
      source: t.metr.source,
      url: t.metr.url,
      speed: t.metr.baselineDays / t.metr.doublingDays,
    }),
    signal({
      name: "Capabilities",
      now: `Epoch's Capabilities Index climbs ${t.epoch.perYear} points a year`,
      was: `${t.epoch.baselinePerYear} points a year before reasoning models`,
      source: t.epoch.source,
      url: t.epoch.url,
      speed: t.epoch.perYear / t.epoch.baselinePerYear,
    }),
  ];
  for (const [track, noun] of [
    ["breakthroughs", "A breakthrough"],
    ["releases", "A frontier release"],
  ] as const) {
    const years = TRACK_INFO[track].baselineYears;
    const g = gaps(series[track], years);
    if (!g.recent || !g.before) continue;
    signals.push(
      signal({
        name: track === "breakthroughs" ? "Breakthroughs" : "Frontier releases",
        now: `${noun} every ${formatInterval(g.recent)} over the last year`,
        was: `${formatInterval(g.before)} the ${yearsWord(years)} years before`,
        source: "Our count",
        url: "#gaps",
        speed: g.before / g.recent,
      }),
    );
  }
  const { now, before } = t.metaculus;
  const away = (r: { read: string; median: string }) => (toDay(r.median) - toDay(r.read)) / YEAR;
  const elapsed = (toDay(now.read) - toDay(before.read)) / YEAR;
  // How fast the expected date nears: 1× if it holds still, faster if forecasters keep pulling it in.
  const nearing = (away(before) - away(now)) / elapsed;
  signals.push(
    signal({
      name: "Forecasters",
      now: `Metaculus forecasters expect general AI in ${month(now.median)}`,
      was: `${month(before.median)} a year earlier`,
      source: t.metaculus.source,
      url: t.metaculus.url,
      speed: nearing,
      pace: nearing > 0 ? `the date nears ${formatTimes(nearing)} as fast as the calendar` : "the date is receding",
    }),
  );

  const score = signals.reduce((sum, s) => sum + s.score, 0) / signals.length;
  return { score, zone: zoneFor(score), signals };
}
