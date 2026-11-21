"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { useMediaQuery } from "@/lib/hooks";
import { formatDay, formatGap, toDay, TRACK_INFO, type Series, type Track } from "@/lib/metrics";
import { useTip } from "./Tip";

type Point = { day: number; title: string; org: string; why: string; now: boolean };
type Segment = { gap: number; length: number; untracked: boolean };

const GREY: [number, number, number] = [208, 208, 204];

/** 0 for a decade between events, 1 for the same day. */
const heat = (gap: number) => Math.min(1, Math.max(0, 1 - Math.log(1 + gap) / Math.log(1 + 3650)));
const mix = (t: number, to: [number, number, number]) =>
  `rgb(${GREY.map((v, i) => Math.round(v + (to[i] - v) * t)).join(",")})`;

const LABEL_WIDTH = 176;
const LANE_OFFSET = { 1: 36, 2: 112 } as const;
const LANES = [-1, 1, -2, 2] as const;

function layout(s: Series, vertical: boolean) {
  const points: Point[] = [
    ...s.events.map((e) => ({ day: e.day, title: e.title, org: e.org, why: e.why, now: false })),
    { day: s.asOf, title: "Now", org: "", why: "", now: true },
  ];
  // Spacing grows with the log of the gap, so a decade and a day both fit on one line.
  const perLog = vertical ? 20 : 24;
  const minimum = vertical ? 74 : 58;
  const untrackedLength = vertical ? 130 : 170;
  const segments: Segment[] = [];
  const offsets = [0];
  for (let i = 1; i < points.length; i++) {
    const gap = points[i].day - points[i - 1].day;
    const untracked = s.untracked.some(([a, b]) => points[i - 1].day < a && points[i].day > b);
    const length = untracked ? untrackedLength : Math.max(minimum, perLog * Math.log2(1 + gap));
    segments.push({ gap, length, untracked });
    offsets.push(offsets[i - 1] + length);
  }
  const start = vertical ? 10 : 70;
  const total = offsets[offsets.length - 1] + start + (vertical ? 40 : 220);
  const at = offsets.map((o) => start + o);

  const years: { year: number; at: number; labeled: boolean }[] = [];
  let lastLabel = -Infinity;
  const firstYear = new Date(points[0].day * 864e5).getUTCFullYear() + 1;
  const lastYear = new Date(s.asOf * 864e5).getUTCFullYear();
  for (let year = firstYear; year <= lastYear; year++) {
    const d = toDay(`${year}-01-01`);
    const i = points.findIndex((p, j) => j < points.length - 1 && p.day <= d && points[j + 1].day > d);
    if (i < 0) continue;
    const pos = at[i] + ((d - points[i].day) / segments[i].gap) * segments[i].length;
    const labeled = pos - lastLabel >= (vertical ? 22 : 40);
    if (labeled) lastLabel = pos;
    years.push({ year, at: pos, labeled });
  }

  const lanes: number[] = [];
  if (!vertical) {
    const lastRight: Record<number, number> = { [-1]: -Infinity, 1: -Infinity, [-2]: -Infinity, 2: -Infinity };
    for (const p of at) {
      let lane: number | undefined = LANES.find((l) => lastRight[l] + 14 <= p);
      lane ??= LANES.reduce((a, b) => (lastRight[a] <= lastRight[b] ? a : b));
      lastRight[lane] = p + LABEL_WIDTH;
      lanes.push(lane);
    }
  }
  return { points, segments, at, total, years, lanes };
}

export function Timeline({ series, track }: { series: Series; track: Track }) {
  const vertical = useMediaQuery("(max-width: 640px)");
  const { points, segments, at, total, years, lanes } = useMemo(() => layout(series, vertical), [series, vertical]);
  const scroller = useRef<HTMLDivElement>(null);
  const [atEnd, setAtEnd] = useState(false);
  const tip = useTip();
  const rgb = TRACK_INFO[track].rgb;
  const line = vertical ? 58 : 196;
  const height = 392;

  useEffect(() => {
    const el = scroller.current;
    if (!el || vertical) return;
    el.scrollLeft = 0;
    // A vertical wheel scrolls the timeline sideways until it reaches either end.
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      const max = el.scrollWidth - el.clientWidth;
      if ((e.deltaY > 0 && el.scrollLeft >= max - 1) || (e.deltaY < 0 && el.scrollLeft <= 0)) return;
      e.preventDefault();
      el.scrollLeft += e.deltaY;
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [vertical, series]);

  const onScroll = () => {
    const el = scroller.current;
    if (el) setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 40);
  };

  const seg = (from: number, to: number) =>
    vertical ? { x1: line, x2: line, y1: from, y2: to } : { x1: from, x2: to, y1: line, y2: line };
  const dot = (p: number) => (vertical ? { cx: line, cy: p } : { cx: p, cy: line });
  const last = series.events[series.events.length - 1];

  return (
    <>
      <div className="tl" ref={scroller} onScroll={onScroll}>
        <div className="tl-track" style={vertical ? { height: total } : { width: total, height }}>
          <svg width={vertical ? "100%" : total} height={vertical ? total : height}>
            <line {...seg(0, at[0])} stroke="#ddd" strokeWidth={2} strokeDasharray="2 4" />
            {segments.map((s, i) => {
              const isLast = i === segments.length - 1;
              return (
                <line
                  key={i}
                  {...seg(at[i], at[i + 1])}
                  stroke={s.untracked ? "#d4d4d0" : mix(heat(s.gap), rgb)}
                  strokeWidth={s.untracked || isLast ? 2 : 3}
                  strokeLinecap="round"
                  strokeDasharray={s.untracked ? "5 5" : isLast ? "1 5" : undefined}
                />
              );
            })}
            {years.map((y) => (
              <line
                key={y.year}
                {...(vertical
                  ? { x1: line - 4, x2: line + 4, y1: y.at, y2: y.at }
                  : { x1: y.at, x2: y.at, y1: line - 4, y2: line + 4 })}
                stroke="rgba(0,0,0,.25)"
              />
            ))}
            {!vertical &&
              points.map((_, i) => {
                const lane = lanes[i];
                const top = lane < 0 ? line - LANE_OFFSET[Math.abs(lane) as 1 | 2] : line + LANE_OFFSET[Math.abs(lane) as 1 | 2];
                return (
                  <line key={i} x1={at[i]} x2={at[i]} y1={line + (lane < 0 ? -7 : 7)} y2={top} stroke="rgba(0,0,0,.12)" />
                );
              })}
            {points.map((p, i) =>
              p.now ? (
                <g key="now">
                  <circle {...dot(at[i])} r={5} fill="none" stroke={TRACK_INFO[track].color} strokeWidth={2} className="pulse" />
                  <circle {...dot(at[i])} r={5} fill={TRACK_INFO[track].color} />
                </g>
              ) : (
                <circle
                  key={i}
                  {...dot(at[i])}
                  r={4.5}
                  fill="#fff"
                  stroke={i ? mix(heat(segments[i - 1].gap), rgb) : mix(0, rgb)}
                  strokeWidth={2.2}
                />
              ),
            )}
          </svg>

          {segments.map((s, i) => {
            const room = vertical ? s.length >= 110 : s.length >= 74;
            if (!s.untracked && !room) return null;
            const mid = (at[i] + at[i + 1]) / 2;
            return (
              <div
                key={i}
                className="gap-label"
                style={vertical ? { left: line + 14, top: mid } : { left: mid, top: line - 9 }}
              >
                {s.untracked ? "not backfilled yet" : formatGap(s.gap)}
              </div>
            );
          })}
          {years
            .filter((y) => y.labeled)
            .map((y) => (
              <div
                key={y.year}
                className="year-label"
                style={vertical ? { left: line - 10, top: y.at } : { left: y.at, top: line + 12 }}
              >
                {y.year}
              </div>
            ))}
          {points.map((p, i) => {
            let style: CSSProperties;
            let up = false;
            if (vertical) {
              style = { left: line + 22, top: at[i] - 9 };
            } else {
              const lane = lanes[i];
              up = lane < 0;
              const offset = LANE_OFFSET[Math.abs(lane) as 1 | 2];
              style = { left: at[i], top: up ? line - offset : line + offset };
            }
            return (
              <div
                key={i}
                className={`ev${up ? " up" : ""}${p.now ? " now" : ""}`}
                style={style}
                onPointerMove={
                  p.now
                    ? undefined
                    : (e) =>
                        tip.show(
                          <>
                            <time>
                              {formatDay(p.day)} · {p.org}
                            </time>
                            <b>{p.title}</b>
                            <p>{p.why}</p>
                          </>,
                          e.clientX,
                          e.clientY,
                        )
                }
                onPointerLeave={tip.hide}
              >
                <time>{formatDay(p.day)}</time>
                <b>{p.title}</b>
                <span>{p.now ? `${series.asOf - last.day} days since the last one` : p.org}</span>
              </div>
            );
          })}
        </div>
      </div>
      {!vertical && (
        <div className="tl-foot">
          <span>{atEnd ? "Now" : "Scroll →"}</span>
          <button
            onClick={() => {
              const el = scroller.current;
              if (el) el.scrollTo({ left: atEnd ? 0 : el.scrollWidth, behavior: "smooth" });
            }}
          >
            {atEnd ? `← Back to ${points[0].title}` : "Jump to now →"}
          </button>
        </div>
      )}
    </>
  );
}
