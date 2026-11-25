import { z } from "zod";
import breakthroughs from "../../data/breakthroughs.json";
import daily from "../../data/daily.json";
import releases from "../../data/releases.json";
import meta from "../../data/meta.json";
import problems from "../../data/problems.json";
import { FIELDS } from "./logos";
import { makeSeries, type AiEvent, type Meta, type Series, type Track } from "./metrics";
import { loadTakeoff, type Takeoff } from "./takeoff";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const eventsSchema = z.array(
  z.object({
    date: isoDate,
    title: z.string().min(1),
    org: z.string().min(1),
    why: z.string().min(1),
    field: z.enum(FIELDS).optional(),
    icon: z.string().regex(/^[a-z0-9-]+$/).optional(),
    url: z.url().optional(),
  }),
);

/** "What did AI do today?": everything notable AI achieved each day, each with its source. */
export const dailySchema = z.array(
  z.object({
    date: isoDate,
    title: z.string().min(1),
    org: z.string().min(1),
    why: z.string().min(1),
    url: z.url(),
  }),
);
export type Daily = z.infer<typeof dailySchema>[number];

/** ProofAtlas's top 500 open problems in math, in its order, with who has settled each one since. */
export const problemsSchema = z.object({
  updated: isoDate,
  problems: z
    .array(
      z.object({
        rank: z.number().int().min(1).max(500),
        title: z.string().min(1),
        field: z.string().min(1),
        status: z.enum(["Solved", "Disproved", "Shown independent"]).optional(),
        by: z.array(z.object({ name: z.string().min(1), url: z.url() })).min(1).optional(),
      }),
    )
    .length(500),
});
export type Problem = z.infer<typeof problemsSchema>["problems"][number];

export const metaSchema = z.object({
  asOf: isoDate,
  updated: z.iso.datetime({ offset: true }),
  untracked: z.array(z.tuple([isoDate, isoDate])),
});

export type Dataset = {
  meta: Meta;
  tracks: Record<Track, AiEvent[]>;
  daily: Daily[];
  problems: z.infer<typeof problemsSchema>;
  takeoff: Takeoff;
};

export function loadDataset(): Dataset {
  return {
    meta: metaSchema.parse(meta),
    tracks: {
      breakthroughs: eventsSchema.parse(breakthroughs),
      releases: eventsSchema.parse(releases),
    },
    daily: dailySchema.parse(daily),
    problems: problemsSchema.parse(problems),
    takeoff: loadTakeoff(),
  };
}

export function loadSeries(track: Track): Series {
  const { meta, tracks } = loadDataset();
  return makeSeries(tracks[track], meta);
}
