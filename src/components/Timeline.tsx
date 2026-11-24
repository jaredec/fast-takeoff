"use client";

import { useMemo, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import { BASE_PATH } from "@/lib/basePath";
import { useElementWidth, useMediaQuery } from "@/lib/hooks";
import { fieldGroup, groupColor, logosFor, type Field } from "@/lib/logos";
import { formatDay, fromDay, toDay, type DayEvent, type Series } from "@/lib/metrics";
import { useTip } from "./Tip";

const GAP = 2;
/** Half the height of the band around the axis that holds the tick labels. */
const BAND = 11;
/** On phones the axis runs down the page instead, with the tick labels sitting across it. */
const VERTICAL_BAND = 20;
/** How tall the vertical timeline is: long enough to scroll through, short enough to read. */
const TALL = 2600;
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
function swarm(xs: number[], size: number, band = BAND) {
  const r = size / 2;
  const clear = 2 * r + GAP;
  const placed: { x: number; y: number }[] = [];
  const ys = xs.map((xi) => {
    const near = placed.filter((p) => Math.abs(p.x - xi) < clear);
    const base = band + r;
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
  const above = Math.max(band, ...ys.map((y) => y + r));
  const below = Math.max(band, ...ys.map((y) => -y + r));
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

  const ticks = ticksFor(from, s.asOf, perDay).map((t) => ({ ...t, x: x(t.day) }));

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

/** Years across long ranges, months across short ones, with the year on each January. */
function ticksFor(from: number, asOf: number, perDay: number) {
  const ticks: { key: number; day: number; label: string }[] = [];
  const first = fromDay(from);
  if (asOf - from > 3 * 365) {
    const step = perDay * 365 < 40 ? 2 : 1;
    for (let year = first.getUTCFullYear() + 1; year <= fromDay(asOf).getUTCFullYear(); year++) {
      if (year % step === 0) ticks.push({ key: year, day: toDay(`${year}-01-01`), label: String(year) });
    }
  } else {
    const step = perDay * 30.4 < 36 ? 3 : 1;
    for (let m = first.getUTCMonth() + 1, y = first.getUTCFullYear(); ; m++) {
      const day = Date.UTC(y, m, 1) / 864e5;
      if (day > asOf) break;
      const d = fromDay(day);
      if (d.getUTCMonth() % step) continue;
      const label = d.getUTCMonth() ? d.toLocaleDateString("en-US", { month: "short", timeZone: "UTC" }) : String(d.getUTCFullYear());
      ticks.push({ key: day, day, label });
    }
  }
  return ticks;
}

/**
 * The phone version: newest at the top under "Now", time running down the page, and each event on
 * whichever side of the axis has room closest to it.
 */
function layoutVertical(s: Series, width: number) {
  const height = TALL;
  const from = START;
  const top = 30;
  const bottom = 16;
  const perDay = (height - top - bottom) / (s.asOf - from);
  const y = (day: number) => top + (s.asOf - day) * perDay;
  const axis = width / 2;

  const events = s.events.filter((e) => e.day >= from && e.day <= s.asOf);
  const ys = events.map((e) => y(e.day));
  let size = 24;
  let swarmed = swarm(ys, size, VERTICAL_BAND);
  while (size > 8 && Math.max(swarmed.above, swarmed.below) > axis - 2) swarmed = swarm(ys, --size, VERTICAL_BAND);

  return {
    size,
    height,
    axis,
    top,
    marks: events.map((e, i) => ({ e, x: axis + swarmed.ys[i], y: ys[i] })),
    ticks: ticksFor(from, s.asOf, perDay)
      .map((t) => ({ ...t, y: y(t.day) }))
      .filter((t) => t.y - top > 20 && t.y < height - 8),
    bands: s.untracked
      .filter(([a, b]) => b >= from && a <= s.asOf)
      .map(([a, b]) => ({ top: y(Math.min(b, s.asOf)), bottom: y(Math.max(a, from)) })),
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

/** Phones scroll through the whole timeline, so they ignore `range`. */
export function Timeline({ series, range }: { series: Series; range: Range }) {
  const ref = useRef<HTMLDivElement>(null);
  const narrow = useMediaQuery("(max-width: 640px)");
  const vertical = useMediaQuery("(max-width: 720px)");
  const width = useElementWidth(ref);
  const days = RANGES.find((r) => r.id === range)!.days;
  const from = days ? series.asOf - days + 1 : START;
  const view = useMemo(
    () => (width && !vertical ? layout(series, from, width, narrow) : null),
    [series, from, width, narrow, vertical],
  );
  const tall = useMemo(
    () => (width && vertical ? layoutVertical(series, width) : null),
    [series, width, vertical],
  );
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
  const gapTip = (ev: PointerEvent) => tip.show(<b>Not backfilled yet</b>, ev.clientX, ev.clientY);

  const mark = (e: DayEvent, size: number, at: CSSProperties) => (
    <button
      key={keyOf(e)}
      className={e.field ? "mark dot" : "mark"}
      aria-label={`${e.title}, ${formatDay(e.day)}`}
      aria-current={active === keyOf(e) || undefined}
      style={
        {
          ...at,
          width: size,
          height: size,
          "--grow": Math.max(1.3, 30 / size).toFixed(2),
          "--fc": e.field ? groupColor(fieldGroup(e.field as Field)) : undefined,
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
      {!e.field && <Icon e={e} className="mark-icon" />}
    </button>
  );

  if (vertical) {
    return (
      <div className="swarm vertical" ref={ref} style={{ height: TALL }} data-active={active ? "" : undefined}>
        {tall && (
          <>
            {tall.bands.map((b, i) => (
              <div
                key={i}
                className="swarm-gap"
                style={{ left: 0, right: 0, top: b.top, height: b.bottom - b.top }}
                onPointerMove={gapTip}
                onPointerLeave={leave}
              />
            ))}
            <div className="swarm-axis" style={{ left: tall.axis, top: tall.top, bottom: 0 }} />
            {tall.ticks.map((t) => (
              <span key={t.key} className="swarm-year" style={{ left: tall.axis, top: t.y }}>
                {t.label}
              </span>
            ))}
            <div className="swarm-now" style={{ left: tall.axis, top: tall.top }}>
              <i />
              <span>Now</span>
            </div>
            {tall.marks.map(({ e, x, y }) =>
              mark(e, tall.size, { left: x - tall.size / 2, top: y - tall.size / 2 }),
            )}
          </>
        )}
      </div>
    );
  }

  return (
    <div className="swarm" ref={ref} style={{ height: roomFor(narrow) + 24 }} data-active={active ? "" : undefined}>
      {view && (
        <>
          {view.bands.map((b, i) => (
            <div
              key={i}
              className="swarm-gap"
              style={{ left: b.left, width: b.right - b.left, bottom: view.axis - view.below, height: view.above + view.below }}
              onPointerMove={gapTip}
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
          {view.marks.map(({ e, x, y }) =>
            mark(e, view.size, { left: x - view.size / 2, bottom: view.axis + y - view.size / 2 }),
          )}
        </>
      )}
    </div>
  );
}
