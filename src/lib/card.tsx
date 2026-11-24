import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { loadSeries } from "./data";
import { needlePoints, zoneArcs } from "./gauge";
import {
  countsByYear,
  formatDay,
  formatInterval,
  formatRate,
  fromDay,
  rateAt,
  TRACK_INFO,
  UNITS,
  type Track,
  type Unit,
} from "./metrics";
import { loadTakeoff, readIndex, zoneFor } from "./takeoff";

const fontDir = join(process.cwd(), "assets/fonts");
const fonts = Promise.all(
  ["et-book-roman.ttf", "et-book-italic.ttf", "et-book-bold.ttf"].map((f) => readFile(join(fontDir, f))),
);

export const CARD_SIZE = { width: 1200, height: 675 };

const INK = "#2b2b2b";
const META = "#757575";
const RULE = "rgba(0,0,0,.12)";

function GaugePanel({ score }: { score: number }) {
  const zone = zoneFor(score);
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <svg width={460} height={258} viewBox="0 0 300 168">
        {zoneArcs(150, 150, 108).map(({ zone: z, d }) => (
          <path key={z.name} d={d} stroke={z === zone ? "#c8c8c8" : "#e6e6e6"} strokeWidth={34} fill="none" />
        ))}
        <polygon points={needlePoints(150, 150, 88, score / 100, 4.5)} fill="#424242" />
        <circle cx={150} cy={150} r={9} fill="#424242" />
        <circle cx={150} cy={150} r={3.5} fill="#fff" />
      </svg>
      <div style={{ display: "flex", alignItems: "center", marginTop: 14, fontSize: 40, color: INK }}>
        <div style={{ width: 18, height: 18, borderRadius: 9, background: zone.color, marginRight: 14 }} />
        {zone.name}
      </div>
    </div>
  );
}

function BarsPanel({ track }: { track: Track }) {
  const series = loadSeries(track);
  const last = fromDay(series.asOf).getUTCFullYear();
  const years = countsByYear(series, last - 7, last);
  const max = Math.max(...years.map((y) => y.count), 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", height: 300, width: 460 }}>
      {years.map((y) => (
        <div key={y.year} style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 57 }}>
          <div style={{ display: "flex", fontSize: 22, color: META, marginBottom: 6 }}>{y.count}</div>
          <div
            style={{
              width: 34,
              height: Math.max(2, (y.count / max) * 220),
              background: TRACK_INFO[track].color,
              opacity: y.year === last ? 0.45 : 1,
            }}
          />
          <div style={{ display: "flex", fontSize: 20, color: META, marginTop: 8 }}>{`'${String(y.year).slice(2)}`}</div>
        </div>
      ))}
    </div>
  );
}

export async function renderCard(track: Track, unit: Unit) {
  const series = loadSeries(track);
  const [roman, italic, bold] = await fonts;
  const index = track === "breakthroughs";
  const rate = rateAt(series, series.asOf, 90);
  const reading = index
    ? readIndex(loadTakeoff(), { breakthroughs: loadSeries("breakthroughs"), releases: loadSeries("releases") })
    : null;
  const value = reading ? String(Math.round(reading.score)) : formatRate(rate ? rate.perDay * UNITS[unit] : 0);
  const lines = reading
    ? ["From METR, Epoch AI and Metaculus", "and the pace of breakthroughs and releases"]
    : [rate && rate.perDay > 0 ? `One every ${formatInterval(1 / rate.perDay)}` : ""];

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "#fff",
          padding: "50px 64px 44px",
          fontFamily: "ET Book",
          color: INK,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 24, letterSpacing: 4, color: META }}>
          <div>{index ? "THE SINGULARITY INDEX" : "SINGULARITY INDEX · FRONTIER RELEASES"}</div>
          <div>
            {formatDay(series.asOf, { month: "long", day: "numeric", year: "numeric" }).toUpperCase()}
          </div>
        </div>
        <div style={{ height: 1, background: RULE, marginTop: 18 }} />

        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          {reading ? <GaugePanel score={reading.score} /> : <BarsPanel track={track} />}
          <div style={{ display: "flex", flexDirection: "column", width: 540 }}>
            <div style={{ fontSize: 40, fontStyle: "italic", color: META }}>
              {index ? "How fast AI is moving" : "AI labs are shipping"}
            </div>
            <div style={{ fontSize: 200, lineHeight: 1, marginTop: 4, letterSpacing: -4 }}>{value}</div>
            <div style={{ fontSize: 48, marginTop: 4 }}>
              {index ? "out of 100" : `frontier models a ${unit}`}
            </div>
            {lines.map((line, i) => (
              <div key={i} style={{ fontSize: 30, color: META, marginTop: i ? 4 : 22 }}>
                {line}
              </div>
            ))}
          </div>
        </div>

        <div style={{ height: 1, background: RULE }} />
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 26, color: META, marginTop: 16 }}>
          <div>thefasttakeoff.com</div>
          <div>@thefasttakeoff</div>
        </div>
      </div>
    ),
    {
      ...CARD_SIZE,
      fonts: [
        { name: "ET Book", data: roman, weight: 400, style: "normal" },
        { name: "ET Book", data: italic, weight: 400, style: "italic" },
        { name: "ET Book", data: bold, weight: 700, style: "normal" },
      ],
    },
  );
}
