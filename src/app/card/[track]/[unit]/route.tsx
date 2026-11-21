import { renderCard } from "@/lib/card";
import { isTrack, isUnit, TRACKS, UNITS } from "@/lib/metrics";

export function generateStaticParams() {
  return TRACKS.flatMap((track) => Object.keys(UNITS).map((unit) => ({ track, unit })));
}

export async function GET(_request: Request, ctx: RouteContext<"/card/[track]/[unit]">) {
  const { track, unit } = await ctx.params;
  if (!isTrack(track) || !isUnit(unit)) return new Response("Not found", { status: 404 });
  return renderCard(track, unit);
}
