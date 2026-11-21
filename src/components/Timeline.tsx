"use client";

import { useEffect, useMemo, useRef, type CSSProperties, type PointerEvent } from "react";
import { BASE_PATH } from "@/lib/basePath";
import { useMediaQuery } from "@/lib/hooks";
import { logosFor } from "@/lib/logos";
import { formatDay, fromDay, toDay, type DayEvent, type Series } from "@/lib/metrics";
import { useTip } from "./Tip";

const GAP = 3;
const AXIS = 34;
/** AlexNet, where the deep learning era starts. Both tracks share this axis. */
const START = toDay("2012-09-30");

/** Each event sits at its true date on a fixed scale; events that would overlap stack upward. */
function layout(s: Series, narrow: boolean) {
  const size = narrow ? 28 : 34;
  const perDay = (narrow ? 170 : 300) / 365.25;
  const pad = size + 24;
  const x = (day: number) => pad + (day - START) * perDay;
  const width = x(s.asOf) + 80;

  const events = s.events.filter((e) => e.day >= START);
  const right: number[] = [];
  const levels = events.map((e) => {
    const at = x(e.day);
    let level = right.findIndex((r) => at - r >= size + GAP);
    if (level < 0) level = right.length;
    right[level] = at;
    return level;
  });

  const years: { year: number; x: number }[] = [];
  for (let year = fromDay(START).getUTCFullYear() + 1; year <= fromDay(s.asOf).getUTCFullYear(); year++) {
    years.push({ year, x: x(toDay(`${year}-01-01`)) });
  }

  const bands = s.untracked
    .filter(([a, b]) => b >= START && a <= s.asOf)
    .map(([a, b]) => ({ left: x(Math.max(a, START)), right: x(Math.min(b, s.asOf)) }));

  const height = (Math.max(...levels) + 1) * (size + GAP) + AXIS + 22;
  const marks = events.map((e, i) => ({ e, x: x(e.day), level: levels[i], logos: logosFor(e) }));
  return { size, width, marks, years, bands, height, now: x(s.asOf) };
}

export function Timeline({ series }: { series: Series }) {
  const ref = useRef<HTMLDivElement>(null);
  const narrow = useMediaQuery("(max-width: 640px)");
  const view = useMemo(() => layout(series, narrow), [series, narrow]);
  const tip = useTip();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
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
  }, []);

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
    <div className="swarm" ref={ref}>
      <div className="swarm-track" style={{ width: view.width, height: view.height }}>
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
            <span>{y.year}</span>
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
                "--t": Math.min(1, x / 1400).toFixed(3),
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
      </div>
    </div>
  );
}
