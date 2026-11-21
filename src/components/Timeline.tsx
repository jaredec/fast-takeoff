"use client";

import { useEffect, useMemo, useRef, type CSSProperties, type PointerEvent } from "react";
import { BASE_PATH } from "@/lib/basePath";
import { useMediaQuery } from "@/lib/hooks";
import { logosFor } from "@/lib/logos";
import { formatDay, fromDay, isUntracked, toDay, type DayEvent, type Series } from "@/lib/metrics";
import { useTip } from "./Tip";

const GAP = 2;
/** Half the height of the band around the axis that holds the year labels. */
const BAND = 11;
/** AlexNet, where the deep learning era starts. Both tracks share this axis. */
const START = toDay("2012-09-30");

/**
 * Each event sits at its true date, on whichever side of the axis has room closest to it. Circles
 * shrink where events crowd. Under it all, one square per day in week columns, on the same scale.
 */
function layout(s: Series, narrow: boolean) {
  const maxSize = narrow ? 28 : 34;
  const minSize = narrow ? 10 : 12;
  const cell = narrow ? 7 : 10;
  const pitch = cell + 2;
  const perDay = pitch / 7;
  const pad = maxSize + 24;
  const x = (day: number) => pad + (day - START) * perDay;
  const width = x(s.asOf) + 110;

  const events = s.events.filter((e) => e.day >= START);
  const xs = events.map((e) => x(e.day));
  const sizes = xs.map((xi) => {
    const crowd = xs.filter((xj) => Math.abs(xj - xi) <= maxSize * 1.5).length;
    return crowd <= 2 ? maxSize : Math.max(minSize, Math.round(maxSize * Math.sqrt(2 / crowd)));
  });

  // Beeswarm: each circle takes the spot nearest the axis that touches nothing placed before it.
  const placed: { x: number; y: number; r: number }[] = [];
  const ys = xs.map((xi, i) => {
    const r = sizes[i] / 2;
    const clear = (p: (typeof placed)[number]) => p.r + r + GAP;
    const near = placed.filter((p) => Math.abs(p.x - xi) < clear(p));
    const base = BAND + r;
    const options = [base, -base];
    for (const p of near) {
      const dy = Math.sqrt(Math.max(0, clear(p) ** 2 - (xi - p.x) ** 2));
      options.push(p.y + dy, p.y - dy);
    }
    const y = options
      .filter((o) => Math.abs(o) >= base - 0.01 && near.every((p) => (p.x - xi) ** 2 + (p.y - o) ** 2 >= clear(p) ** 2 - 0.01))
      .sort((a, b) => Math.abs(a) - Math.abs(b) || b - a)[0];
    placed.push({ x: xi, y, r });
    return y;
  });
  const above = Math.max(BAND, ...placed.map((p) => p.y + p.r));
  const below = Math.max(BAND, ...placed.map((p) => -p.y + p.r));

  const years: { year: number; x: number }[] = [];
  for (let year = fromDay(START).getUTCFullYear() + 1; year <= fromDay(s.asOf).getUTCFullYear(); year++) {
    years.push({ year, x: x(toDay(`${year}-01-01`)) });
  }

  const bands = s.untracked
    .filter(([a, b]) => b >= START && a <= s.asOf)
    .map(([a, b]) => ({ left: x(Math.max(a, START)), right: x(Math.min(b, s.asOf)) }));

  // Week columns start on the Sunday on or before START.
  const gridStart = START - fromDay(START).getUTCDay();
  const days: { day: number; cls: string }[] = [];
  for (let d = gridStart; d <= s.asOf; d++) {
    const list = d >= START ? s.byDay.get(d) : undefined;
    const cls =
      d < START ? "blank" : list ? `hit l${Math.min(3, list.length)}` : isUntracked(s, d) ? "un" : "";
    days.push({ day: d, cls });
  }

  const gridHeight = 7 * pitch;
  const axis = gridHeight + 22 + below;
  const height = axis + above + 14;
  const marks = events.map((e, i) => ({ e, x: xs[i], y: ys[i], size: sizes[i], logos: logosFor(e) }));
  return { cell, width, marks, years, bands, days, gridLeft: x(gridStart), axis, above, below, height, now: x(s.asOf) };
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

  const first = view.marks[0]?.x ?? 0;
  useEffect(() => {
    if (ref.current) ref.current.scrollLeft = first - 60;
  }, [first]);

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
  const showDay = (target: EventTarget, x: number, y: number) => {
    const day = Number((target as HTMLElement).dataset.day);
    if (!day) return tip.hide();
    const list = series.byDay.get(day);
    tip.show(
      <>
        <time>{formatDay(day, { weekday: "short", month: "short", day: "numeric", year: "numeric" })}</time>
        {list ? list.map((e) => <b key={e.title} style={{ display: "block" }}>{e.title}</b>) : isUntracked(series, day) ? "Not backfilled yet" : "Nothing"}
      </>,
      x,
      y,
    );
  };

  return (
    <div className="swarm" ref={ref}>
      <div className="swarm-track" style={{ width: view.width, height: view.height }}>
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
        {view.years.map((y) => (
          <span key={y.year} className="swarm-year" style={{ left: y.x, bottom: view.axis }}>
            {y.year}
          </span>
        ))}
        <div className="swarm-now" style={{ left: view.now, bottom: view.axis }}>
          <i />
          <span>Now</span>
        </div>
        {view.marks.map(({ e, x, y, size, logos }, i) => (
          <button
            key={`${e.date}-${i}`}
            className="mark"
            aria-label={`${e.title}, ${formatDay(e.day)}`}
            style={
              {
                left: x - size / 2,
                bottom: view.axis + y - size / 2,
                width: size,
                height: size,
                "--t": Math.min(1, x / 1400).toFixed(3),
                "--grow": Math.max(1.3, 30 / size).toFixed(2),
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
        <div
          className="days"
          style={{ left: view.gridLeft, "--cell": `${view.cell}px` } as CSSProperties}
          onPointerOver={(ev) => ev.pointerType === "mouse" && showDay(ev.target, ev.clientX, ev.clientY)}
          onPointerLeave={leave}
          onClick={(ev) => showDay(ev.target, ev.clientX, ev.clientY)}
        >
          {view.days.map((d) => (
            <i key={d.day} data-day={d.cls === "blank" ? undefined : d.day} className={d.cls || undefined} />
          ))}
        </div>
      </div>
    </div>
  );
}
