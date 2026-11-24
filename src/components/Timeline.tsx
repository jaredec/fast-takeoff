"use client";

import { useMemo, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import { BASE_PATH } from "@/lib/basePath";
import { useElementWidth, useMediaQuery } from "@/lib/hooks";
import { logosFor } from "@/lib/logos";
import { formatDay, fromDay, toDay, type DayEvent, type Series } from "@/lib/metrics";
import { useTip } from "./Tip";

const GAP = 2;
/** Half the height of the band around the axis that holds the tick labels. */
const BAND = 11;
/** AlexNet, where the deep learning era starts. Both tracks share this axis. */
const START = toDay("2012-09-30");

export const RANGES = [
  { id: "90d", label: "90 days", days: 90 },
  { id: "1y", label: "Year", days: 365 },
  { id: "5y", label: "5 years", days: 1826 },
  { id: "all", label: "All", days: 0 },
] as const;
export type Range = (typeof RANGES)[number]["id"];

const keyOf = (e: DayEvent) => `${e.date} ${e.title}`;
/** How tall the swarm may grow, axis centered. */
const roomFor = (narrow: boolean) => (narrow ? 190 : 260);

/** Beeswarm: each circle takes the spot nearest the axis that touches nothing placed before it. */
function swarm(xs: number[], size: number) {
  const r = size / 2;
  const clear = 2 * r + GAP;
  const placed: { x: number; y: number }[] = [];
  const ys = xs.map((xi) => {
    const near = placed.filter((p) => Math.abs(p.x - xi) < clear);
    const base = BAND + r;
    const options = [base, -base];
    for (const p of near) {
      const dy = Math.sqrt(Math.max(0, clear ** 2 - (xi - p.x) ** 2));
      options.push(p.y + dy, p.y - dy);
    }
    const y = options
      .filter((o) => Math.abs(o) >= base - 0.01 && near.every((p) => (p.x - xi) ** 2 + (p.y - o) ** 2 >= clear ** 2 - 0.01))
      .sort((a, b) => Math.abs(a) - Math.abs(b) || b - a)[0];
    placed.push({ x: xi, y });
    return y;
  });
  const above = Math.max(BAND, ...ys.map((y) => y + r));
  const below = Math.max(BAND, ...ys.map((y) => -y + r));
  return { ys, above, below };
}

/**
 * Every event in the range at its true date, fitted to `width`, on whichever side of the axis has room
 * closest to it. All circles share the largest size that keeps each side of the axis within half of
 * `room`, so the axis sits at the same height whatever the track or range.
 */
function layout(s: Series, from: number, width: number, narrow: boolean) {
  const maxSize = narrow ? 24 : 30;
  const minSize = narrow ? 5 : 6;
  const room = roomFor(narrow);
  const pad = maxSize / 2 + 6;
  const perDay = (width - pad - 54) / (s.asOf - from);
  const x = (day: number) => pad + (day - from) * perDay;

  const events = s.events.filter((e) => e.day >= from && e.day <= s.asOf);
  const xs = events.map((e) => x(e.day));
  let size = maxSize;
  let swarmed = swarm(xs, size);
  while (size > minSize && Math.max(swarmed.above, swarmed.below) > room / 2) swarmed = swarm(xs, --size);
  const { ys } = swarmed;
  const above = room / 2;
  const below = room / 2;

  // Years across long ranges, months across short ones, with the year on each January.
  const ticks: { key: number; x: number; label: string }[] = [];
  const first = fromDay(from);
  if (s.asOf - from > 3 * 365) {
    const step = perDay * 365 < 40 ? 2 : 1;
    for (let year = first.getUTCFullYear() + 1; year <= fromDay(s.asOf).getUTCFullYear(); year++) {
      if (year % step === 0) ticks.push({ key: year, x: x(toDay(`${year}-01-01`)), label: String(year) });
    }
  } else {
    const step = perDay * 30.4 < 36 ? 3 : 1;
    for (let m = first.getUTCMonth() + 1, y = first.getUTCFullYear(); ; m++) {
      const day = Date.UTC(y, m, 1) / 864e5;
      if (day > s.asOf) break;
      const d = fromDay(day);
      if (d.getUTCMonth() % step) continue;
      const label = d.getUTCMonth() ? d.toLocaleDateString("en-US", { month: "short", timeZone: "UTC" }) : String(d.getUTCFullYear());
      ticks.push({ key: day, x: x(day), label });
    }
  }

  const bands = s.untracked
    .filter(([a, b]) => b >= from && a <= s.asOf)
    .map(([a, b]) => ({ left: x(Math.max(a, from)), right: x(Math.min(b, s.asOf)) }));

  const axis = 12 + below;
  const marks = events.map((e, i) => ({ e, x: xs[i], y: ys[i], logos: logosFor(e) }));
  return {
    size,
    marks,
    ticks: ticks.filter((t) => t.x > 16 && x(s.asOf) - t.x > 40),
    bands,
    axis,
    above,
    below,
    height: axis + above + 12,
    now: x(s.asOf),
  };
}

function Icon({ e, className }: { e: DayEvent; className?: string }) {
  const logos = logosFor(e);
  return (
    <span className={className}>
      {/* eslint-disable-next-line @next/next/no-img-element -- tiny static SVGs */}
      <img src={`${BASE_PATH}/logos/${logos[0]}.svg`} alt="" />
      {logos[1] && (
        <span className="mark-2">
          {/* eslint-disable-next-line @next/next/no-img-element -- tiny static SVGs */}
          <img src={`${BASE_PATH}/logos/${logos[1]}.svg`} alt="" />
        </span>
      )}
    </span>
  );
}

export function Timeline({ series, range }: { series: Series; range: Range }) {
  const ref = useRef<HTMLDivElement>(null);
  const narrow = useMediaQuery("(max-width: 640px)");
  const width = useElementWidth(ref);
  const days = RANGES.find((r) => r.id === range)!.days;
  const from = days ? series.asOf - days + 1 : START;
  const view = useMemo(() => (width ? layout(series, from, width, narrow) : null), [series, from, width, narrow]);
  const [active, setActive] = useState<string | null>(null);
  const tip = useTip();

  const show = (e: DayEvent, x: number, y: number) => {
    setActive(keyOf(e));
    tip.show(
      <>
        <time>
          {formatDay(e.day)} · {e.org}
        </time>
        <b>{e.title}</b>
        <p>{e.why}</p>
      </>,
      x,
      y,
    );
  };
  const showAt = (e: DayEvent, el: HTMLElement) => {
    const r = el.getBoundingClientRect();
    show(e, r.right, r.top + r.height / 2);
  };
  const leave = (ev: PointerEvent) => {
    setActive(null);
    if (ev.pointerType === "mouse") tip.hide();
  };

  return (
    <div className="swarm" ref={ref} style={{ height: roomFor(narrow) + 24 }} data-active={active ? "" : undefined}>
      {view && (
        <>
          {view.bands.map((b, i) => (
            <div
              key={i}
              className="swarm-gap"
              style={{ left: b.left, width: b.right - b.left, bottom: view.axis - view.below, height: view.above + view.below }}
              onPointerMove={(ev) => tip.show(<b>Not backfilled yet</b>, ev.clientX, ev.clientY)}
              onPointerLeave={leave}
            />
          ))}
          <div className="swarm-axis" style={{ bottom: view.axis }} />
          {view.ticks.map((t) => (
            <span key={t.key} className="swarm-year" style={{ left: t.x, bottom: view.axis }}>
              {t.label}
            </span>
          ))}
          <div className="swarm-now" style={{ left: view.now, bottom: view.axis }}>
            <i />
            <span>Now</span>
          </div>
          {view.marks.map(({ e, x, y }) => (
            <button
              key={keyOf(e)}
              className="mark"
              aria-label={`${e.title}, ${formatDay(e.day)}`}
              aria-current={active === keyOf(e) || undefined}
              style={
                {
                  left: x - view.size / 2,
                  bottom: view.axis + y - view.size / 2,
                  width: view.size,
                  height: view.size,
                  "--grow": Math.max(1.3, 30 / view.size).toFixed(2),
                } as CSSProperties
              }
              onPointerMove={(ev) => ev.pointerType === "mouse" && show(e, ev.clientX, ev.clientY)}
              onPointerLeave={leave}
              onClick={(ev) => showAt(e, ev.currentTarget)}
              onFocus={(ev) => showAt(e, ev.currentTarget)}
              onBlur={() => {
                setActive(null);
                tip.hide();
              }}
            >
              <Icon e={e} className="mark-icon" />
            </button>
          ))}
        </>
      )}
    </div>
  );
}
