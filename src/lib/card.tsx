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
  reading,
  TRACK_INFO,
  UNITS,
  type Reading,
  type Track,
  type Unit,
} from "./metrics";

const fontDir = join(process.cwd(), "assets/fonts");
const fonts = Promise.all(
  ["et-book-roman.ttf", "et-book-italic.ttf", "et-book-bold.ttf"].map((f) => readFile(join(fontDir, f))),
);

export const CARD_SIZE = { width: 1200, height: 675 };

const INK = "#2b2b2b";
const META = "#757575";
const RULE = "rgba(0,0,0,.12)";

function GaugePanel({ r }: { r: Reading }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <svg width={460} height={258} viewBox="0 0 300 168">
        {zoneArcs(150, 150, 116).map(({ zone, d }) => (
          <path key={zone.name} d={d} stroke={zone.color} strokeWidth={22} fill="none" />
        ))}
        <polygon points={needlePoints(150, 150, 88, r.fraction, 4.5)} fill="#424242" />
        <circle cx={150} cy={150} r={9} fill="#424242" />
        <circle cx={150} cy={150} r={3.5} fill="#fff" />
      </svg>
      <div style={{ display: "flex", alignItems: "center", marginTop: 14, fontSize: 40, color: INK }}>
        <div style={{ width: 18, height: 18, borderRadius: 9, background: r.zone.color, marginRight: 14 }} />
        {r.zone.name}
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
  const r = reading(series);
  const [roman, italic, bold] = await fonts;
  const value = formatRate(r.rate ? r.rate.perDay * UNITS[unit] : 0);
  const every = r.rate && r.rate.perDay > 0 ? `One every ${formatInterval(1 / r.rate.perDay)}` : "";
  const faster = r.vsTenYears && r.vsTenYears >= 1.5 ? `${Math.round(r.vsTenYears)}× faster than ten years ago` : "";

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
          <div>{track === "breakthroughs" ? "FAST TAKEOFF INDEX" : "FAST TAKEOFF · MODEL RELEASES"}</div>
          <div>{formatDay(series.asOf, { month: "long", day: "numeric", year: "numeric" }).toUpperCase()}</div>
        </div>
        <div style={{ height: 1, background: RULE, marginTop: 18 }} />

        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          {track === "breakthroughs" ? <GaugePanel r={r} /> : <BarsPanel track={track} />}
          <div style={{ display: "flex", flexDirection: "column", width: 540 }}>
            <div style={{ fontSize: 40, fontStyle: "italic", color: META }}>
              {track === "breakthroughs" ? "AI is now moving at" : "AI labs are shipping"}
            </div>
            <div style={{ fontSize: 200, lineHeight: 1, marginTop: 4, letterSpacing: -4 }}>{value}</div>
            <div style={{ fontSize: 48, marginTop: 4 }}>
              {track === "breakthroughs" ? `breakthroughs a ${unit}` : `new models a ${unit}`}
            </div>
            <div style={{ fontSize: 30, color: META, marginTop: 22 }}>{every}</div>
            {faster && <div style={{ fontSize: 30, color: META, marginTop: 4 }}>{faster}</div>}
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
