"use client";

import { useMemo, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import { BASE_PATH } from "@/lib/basePath";
import { useElementWidth } from "@/lib/hooks";
import { fieldGroup, groupColor, logosFor, type Field } from "@/lib/logos";
import { formatDay, fromDay, toDay, type DayEvent, type Series } from "@/lib/metrics";
import { useTip } from "./Tip";

const GAP = 2;
/** Half the width of the band down the axis that holds the tick labels. */
const BAND = 20;
/** How tall the timeline is: long enough to scroll through, short enough to read. */
const TALL = 2600;
/** AlexNet, where the deep learning era starts. Both tracks share this axis. */
const START = toDay("2012-09-30");

const keyOf = (e: DayEvent) => `${e.date} ${e.title}`;

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

/** A tick on each January. */
function ticksFor(from: number, asOf: number) {
  const ticks: { key: number; day: number; label: string }[] = [];
  for (let year = fromDay(from).getUTCFullYear() + 1; year <= fromDay(asOf).getUTCFullYear(); year++) {
    ticks.push({ key: year, day: toDay(`${year}-01-01`), label: String(year) });
  }
  return ticks;
}

/**
 * Newest at the top under "Now", time running down the page, and each event on whichever side of the
 * axis has room closest to it.
 */
function layout(s: Series, width: number) {
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
  let swarmed = swarm(ys, size);
  while (size > 8 && Math.max(swarmed.above, swarmed.below) > axis - 2) swarmed = swarm(ys, --size);

  return {
    size,
    height,
    axis,
    top,
    marks: events.map((e, i) => ({ e, x: axis + swarmed.ys[i], y: ys[i] })),
    ticks: ticksFor(from, s.asOf)
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

export function Timeline({ series }: { series: Series }) {
  const ref = useRef<HTMLDivElement>(null);
  const width = useElementWidth(ref);
  const tall = useMemo(() => (width ? layout(series, width) : null), [series, width]);
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

  return (
    <div className="swarm" ref={ref} style={{ height: TALL }} data-active={active ? "" : undefined}>
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
