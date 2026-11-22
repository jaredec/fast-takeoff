import { z } from "zod";
import data from "../../data/takeoff.json";

/** The index reads METR's time horizon trend: how often the length of task AI can finish alone doubles. */
export const takeoffSchema = z.object({
  source: z.string().min(1),
  url: z.url(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  doublingMonths: z.number().positive(),
  low: z.number().positive(),
  high: z.number().positive(),
  frontier: z.object({ model: z.string().min(1), hours: z.number().positive() }),
});
export type Takeoff = z.infer<typeof takeoffSchema>;

export const loadTakeoff = (): Takeoff => takeoffSchema.parse(data);

/** METR's original 2019–2024 trend: one doubling every 7 months. */
export const BASELINE_MONTHS = 7;

/**
 * Zones run left to right from slowest to fastest doubling. Slow takeoff is the long-run pace or
 * slower, fast takeoff is anything quicker down to a doubling a month, and past that is a singularity.
 */
export const ZONES = [
  { name: "AI winter", from: 48, to: 24, color: "#9db3c9" },
  { name: "Slow takeoff", from: 24, to: BASELINE_MONTHS, color: "#e2c06a" },
  { name: "Fast takeoff", from: BASELINE_MONTHS, to: 1, color: "#df7a45" },
  { name: "Singularity", from: 1, to: 0.25, color: "#b8392c" },
] as const;
export type Zone = (typeof ZONES)[number];

export function zoneFor(months: number): Zone {
  return ZONES.find((z) => months > z.to) ?? ZONES[ZONES.length - 1];
}

/** Where the needle points, from 0 (left) to 1 (right): an equal slice per zone, log scale within it. */
export function gaugeFraction(months: number) {
  const i = ZONES.indexOf(zoneFor(months));
  const { from, to } = ZONES[i];
  const within = Math.min(1, Math.max(0, Math.log(from / months) / Math.log(from / to)));
  return (i + within) / ZONES.length;
}

export const formatMonths = (m: number) => (m >= 10 ? m.toFixed(0) : m.toFixed(1));
