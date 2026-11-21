import { z } from "zod";
import breakthroughs from "../../data/breakthroughs.json";
import releases from "../../data/releases.json";
import meta from "../../data/meta.json";
import { FIELDS } from "./logos";
import { makeSeries, type AiEvent, type Meta, type Series, type Track } from "./metrics";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const eventsSchema = z.array(
  z.object({
    date: isoDate,
    title: z.string().min(1),
    org: z.string().min(1),
    why: z.string().min(1),
    field: z.enum(FIELDS).optional(),
  }),
);

export const metaSchema = z.object({
  asOf: isoDate,
  untracked: z.array(z.tuple([isoDate, isoDate])),
});

export type Dataset = { meta: Meta; tracks: Record<Track, AiEvent[]> };

export function loadDataset(): Dataset {
  return {
    meta: metaSchema.parse(meta),
    tracks: {
      breakthroughs: eventsSchema.parse(breakthroughs),
      releases: eventsSchema.parse(releases),
    },
  };
}

export function loadSeries(track: Track): Series {
  const { meta, tracks } = loadDataset();
  return makeSeries(tracks[track], meta);
}
