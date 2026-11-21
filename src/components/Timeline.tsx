"use client";

import { ZoomIn, ZoomOut } from "lucide-react";
import { useEffect, useMemo, useRef, type CSSProperties, type PointerEvent } from "react";
import { BASE_PATH } from "@/lib/basePath";
import { useElementWidth, useMediaQuery } from "@/lib/hooks";
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
 * Given `fit`, everything squeezes into that many pixels and the squares become one per month.
 */
function layout(s: Series, narrow: boolean, fit: number) {
  const maxSize = fit ? (narrow ? 20 : 26) : narrow ? 28 : 34;
  const minSize = fit ? (narrow ? 5 : 6) : narrow ? 10 : 12;
  const cell = narrow ? 7 : 10;
  const pitch = cell + 2;
  const pad = fit ? maxSize / 2 + 6 : maxSize + 24;
  const perDay = fit ? (fit - pad - 44) / (s.asOf - START) : pitch / 7;
  const x = (day: number) => pad + (day - START) * perDay;
  const width = fit || x(s.asOf) + 110;

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
  const yearStep = perDay * 365 < 40 ? 2 : 1;
  for (let year = fromDay(START).getUTCFullYear() + 1; year <= fromDay(s.asOf).getUTCFullYear(); year++) {
    const at = x(toDay(`${year}-01-01`));
    if (year % yearStep === 0 && x(s.asOf) - at > 40) years.push({ year, x: at });
  }

  const bands = s.untracked
    .filter(([a, b]) => b >= START && a <= s.asOf)
    .map(([a, b]) => ({ left: x(Math.max(a, START)), right: x(Math.min(b, s.asOf)) }));

  // Week columns start on the Sunday on or before START.
  const gridStart = START - fromDay(START).getUTCDay();
  const days: { day: number; cls: string }[] = [];
  for (let d = gridStart; !fit && d <= s.asOf; d++) {
    const list = d >= START ? s.byDay.get(d) : undefined;
    const cls =
      d < START ? "blank" : list ? `hit l${Math.min(3, list.length)}` : isUntracked(s, d) ? "un" : "";
    days.push({ day: d, cls });
  }

  const months: { day: number; left: number; width: number; cls: string }[] = [];
  for (let m = fromDay(START).getUTCMonth(), y = fromDay(START).getUTCFullYear(); fit; m++) {
    const a = Math.max(START, Date.UTC(y, m, 1) / 864e5);
    const b = Math.min(s.asOf, Date.UTC(y, m + 1, 1) / 864e5 - 1);
    if (a > s.asOf) break;
    const n = s.events.filter((e) => e.day >= a && e.day <= b).length;
    const cls = n ? `hit l${n >= 4 ? 3 : n >= 2 ? 2 : 1}` : isUntracked(s, a) && isUntracked(s, b) ? "un" : "";
    months.push({ day: a, left: x(a), width: Math.max(1, x(b + 1) - x(a) - 1), cls });
  }

  const gridHeight = fit ? 10 : 7 * pitch;
  const axis = gridHeight + 22 + below;
  const height = axis + above + 14;
  const marks = events.map((e, i) => ({ e, x: xs[i], y: ys[i], size: sizes[i], logos: logosFor(e) }));
  return { cell, width, marks, years, bands, days, months, gridLeft: x(gridStart), axis, above, below, height, now: x(s.asOf) };
}

export function Timeline({
  series,
  zoomedOut,
  onZoom,
}: {
  series: Series;
  zoomedOut: boolean;
  onZoom: (zoomedOut: boolean) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const narrow = useMediaQuery("(max-width: 640px)");
  const avail = useElementWidth(ref);
  const fit = zoomedOut ? avail : 0;
  const view = useMemo(() => layout(series, narrow, fit), [series, narrow, fit]);
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
  const showMonth = (target: EventTarget, x: number, y: number) => {
    const day = Number((target as HTMLElement).dataset.day);
    if (!day) return tip.hide();
    const d = fromDay(day);
    const end = Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1) / 864e5;
    const list = series.events.filter((e) => e.day >= day && e.day < end);
    tip.show(
      <>
        <time>{formatDay(day, { month: "long", year: "numeric" })}</time>
        {list.length ? list.map((e) => <b key={e.title} style={{ display: "block" }}>{e.title}</b>) : "Nothing"}
      </>,
      x,
      y,
    );
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
    <>
      <button
        className="zoom"
        onClick={() => onZoom(!zoomedOut)}
        aria-pressed={zoomedOut}
        aria-label={zoomedOut ? "Zoom in" : "Zoom out to see it all"}
        title={zoomedOut ? "Zoom in" : "Zoom out to see it all"}
      >
        {zoomedOut ? <ZoomIn size={18} /> : <ZoomOut size={18} />}
      </button>
      <div className="swarm" ref={ref} data-fit={fit ? "" : undefined}>
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
          {fit ? (
            <div
              className="months"
              onPointerOver={(ev) => ev.pointerType === "mouse" && showMonth(ev.target, ev.clientX, ev.clientY)}
              onPointerLeave={leave}
              onClick={(ev) => showMonth(ev.target, ev.clientX, ev.clientY)}
            >
              {view.months.map((m) => (
                <i key={m.day} data-day={m.day} className={m.cls || undefined} style={{ left: m.left, width: m.width }} />
              ))}
            </div>
          ) : (
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
          )}
        </div>
      </div>
    </>
  );
}
