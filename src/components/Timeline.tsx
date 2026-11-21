"use client";

import { useMemo, useRef, type CSSProperties, type PointerEvent } from "react";
import { BASE_PATH } from "@/lib/basePath";
import { useElementWidth } from "@/lib/hooks";
import { logosFor } from "@/lib/logos";
import { formatDay, fromDay, toDay, type DayEvent, type Series } from "@/lib/metrics";
import { useTip } from "./Tip";

const GAP = 3;
const AXIS = 34;
const SIZES = [34, 32, 30, 28, 26, 24, 22, 20, 18, 16, 14];

/** Each event sits at its true date; events that would overlap stack upward. */
function layout(s: Series, width: number) {
  const startYear = fromDay(s.events[0].day).getUTCFullYear();
  const start = toDay(`${startYear}-01-01`);
  const span = s.asOf - start;
  const maxStack = width < 640 ? 300 : 360;

  let size = SIZES[0];
  let x: (day: number) => number = () => 0;
  let levels: number[] = [];
  for (size of SIZES) {
    const pad = size / 2 + 1;
    x = (day: number) => pad + ((day - start) / span) * (width - 2 * pad);
    const right: number[] = [];
    levels = s.events.map((e) => {
      const at = x(e.day);
      let level = right.findIndex((r) => at - r >= size + GAP);
      if (level < 0) level = right.length;
      right[level] = at;
      return level;
    });
    if ((Math.max(...levels) + 1) * (size + GAP) <= maxStack) break;
  }

  const endYear = fromDay(s.asOf).getUTCFullYear();
  const perYear = (width / span) * 365.25;
  const step = [1, 2, 5, 10].find((n) => n * perYear >= 44) ?? 10;
  const years: { year: number; x: number; labeled: boolean }[] = [];
  for (let year = startYear; year <= endYear; year++) {
    const at = x(toDay(`${year}-01-01`));
    years.push({ year, x: at, labeled: year % step === 0 && at < width - 40 });
  }

  const bands = s.untracked
    .filter(([a, b]) => b >= start && a <= s.asOf)
    .map(([a, b]) => ({ left: x(Math.max(a, start)), right: x(Math.min(b, s.asOf)) }));

  const height = (Math.max(...levels) + 1) * (size + GAP) + AXIS + 10;
  const marks = s.events.map((e, i) => ({ e, x: x(e.day), level: levels[i], logos: logosFor(e) }));
  return { size, marks, years, bands, height, now: x(s.asOf) };
}

export function Timeline({ series }: { series: Series }) {
  const ref = useRef<HTMLDivElement>(null);
  const width = useElementWidth(ref);
  const view = useMemo(() => (width ? layout(series, width) : null), [series, width]);
  const tip = useTip();

  const show = (e: DayEvent, x: number, y: number) =>
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
  const showAt = (e: DayEvent, el: HTMLElement) => {
    const r = el.getBoundingClientRect();
    show(e, r.right, r.top + r.height / 2);
  };
  const leave = (ev: PointerEvent) => {
    if (ev.pointerType === "mouse") tip.hide();
  };

  return (
    <div className="swarm" ref={ref} style={{ height: view?.height ?? 320 }}>
      {view && (
        <>
          {view.bands.map((b, i) => (
            <div
              key={i}
              className="swarm-gap"
              style={{ left: b.left, width: b.right - b.left, bottom: AXIS }}
              onPointerMove={(ev) => tip.show(<b>Not backfilled yet</b>, ev.clientX, ev.clientY)}
              onPointerLeave={leave}
            />
          ))}
          <div className="swarm-axis" style={{ bottom: AXIS }} />
          {view.years.map((y) => (
            <div key={y.year} className="swarm-year" style={{ left: y.x, bottom: AXIS - 4 }}>
              {y.labeled && <span>{y.year}</span>}
            </div>
          ))}
          <div className="swarm-now" style={{ left: view.now, bottom: AXIS }}>
            <i />
            <span>Now</span>
          </div>
          {view.marks.map(({ e, x, level, logos }, i) => (
            <button
              key={`${e.date}-${i}`}
              className="mark"
              aria-label={`${e.title}, ${formatDay(e.day)}`}
              style={
                {
                  left: x - view.size / 2,
                  bottom: AXIS + 5 + level * (view.size + GAP),
                  width: view.size,
                  height: view.size,
                  "--t": (x / width).toFixed(3),
                } as CSSProperties
              }
              onPointerMove={(ev) => ev.pointerType === "mouse" && show(e, ev.clientX, ev.clientY)}
              onPointerLeave={leave}
              onClick={(ev) => showAt(e, ev.currentTarget)}
              onFocus={(ev) => showAt(e, ev.currentTarget)}
              onBlur={tip.hide}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- tiny static SVGs */}
              <img src={`${BASE_PATH}/logos/${logos[0]}.svg`} alt="" />
              {logos[1] && (
                <span className="mark-2">
                  {/* eslint-disable-next-line @next/next/no-img-element -- tiny static SVGs */}
                  <img src={`${BASE_PATH}/logos/${logos[1]}.svg`} alt="" />
                </span>
              )}
            </button>
          ))}
        </>
      )}
    </div>
  );
}
