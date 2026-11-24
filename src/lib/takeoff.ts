import { z } from "zod";
import data from "../../data/takeoff.json";
import { formatDay, formatInterval, gaps, toDay, type Series, type Track } from "./metrics";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const reading = z.object({ read: isoDate, median: isoDate });

/** Figures copied from each source's latest update. The index combines them; it never edits them. */
export const takeoffSchema = z.object({
  metr: z.object({
    source: z.string().min(1),
    url: z.url(),
    date: isoDate,
    doublingMonths: z.number().positive(),
    low: z.number().positive(),
    high: z.number().positive(),
    baselineMonths: z.number().positive(),
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
});
export type Takeoff = z.infer<typeof takeoffSchema>;

export const loadTakeoff = (): Takeoff => takeoffSchema.parse(data);

/** How many times faster than its baseline a signal must move to climb one zone. */
export const PACE_PER_ZONE = 8;

/**
 * 50 is the old pace on every signal. The extremes are narrow: Singularity needs about 28 times the old
 * pace on average (90), AI winter about 28 times slower (10).
 */
export const ZONES = [
  { name: "AI winter", from: 0, to: 10, color: "#9db3c9" },
  { name: "Slow takeoff", from: 10, to: 50, color: "#e2c06a" },
  { name: "Fast takeoff", from: 50, to: 90, color: "#df7a45" },
  { name: "Singularity", from: 90, to: 100, color: "#b8392c" },
] as const;
export type Zone = (typeof ZONES)[number];

export const zoneFor = (score: number): Zone => ZONES.find((z) => score < z.to) ?? ZONES[ZONES.length - 1];

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
export const formatMonths = (m: number) => (m >= 10 || Number.isInteger(m) ? m.toFixed(0) : m.toFixed(1));
export const formatTimes = (x: number) => `${x >= 10 ? x.toFixed(0) : x.toFixed(1)}×`;

/** The Fast Takeoff Index: the plain average of each signal's score, like the Fear & Greed Index. */
export function readIndex(t: Takeoff, series: Record<Track, Series>) {
  const signal = (s: Omit<Signal, "score">): Signal => ({ ...s, score: scoreFor(s.speed) });
  const signals: Signal[] = [
    signal({
      name: "Task length",
      now: `The length of task AI can finish alone doubles every ${formatMonths(t.metr.doublingMonths)} months`,
      was: `${formatMonths(t.metr.baselineMonths)} months from 2019 to 2024`,
      source: t.metr.source,
      url: t.metr.url,
      speed: t.metr.baselineMonths / t.metr.doublingMonths,
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
    const g = gaps(series[track]);
    if (!g.recent || !g.before) continue;
    signals.push(
      signal({
        name: track === "breakthroughs" ? "Breakthroughs" : "Frontier releases",
        now: `${noun} every ${formatInterval(g.recent)} over the last year`,
        was: `${formatInterval(g.before)} the five years before`,
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
