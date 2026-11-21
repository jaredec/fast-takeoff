"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { countIn, formatDay, fromDay, isUntracked, toDay, type Series } from "@/lib/metrics";
import { useTip } from "./Tip";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function DayGrid({ series }: { series: Series }) {
  const scroller = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const tip = useTip();
  const lastYear = fromDay(series.asOf).getUTCFullYear();
  const firstYear = Math.max(2012, fromDay(series.events[0].day).getUTCFullYear());

  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, []);

  const years = useMemo(() => {
    const out = [];
    for (let y = lastYear; y >= firstYear; y--) {
      const start = toDay(`${y}-01-01`);
      const end = toDay(`${y + 1}-01-01`) - 1;
      const cells = [];
      for (let d = start; d <= end; d++) {
        const list = series.byDay.get(d);
        let cls = "";
        if (d > series.asOf) cls = "fut";
        else if (isUntracked(series, d)) cls = "un";
        else if (list) cls = `hit l${Math.min(3, list.length)}`;
        cells.push({ day: d, cls });
      }
      out.push({ year: y, count: countIn(series, start, Math.min(end, series.asOf)), lead: fromDay(start).getUTCDay(), cells });
    }
    return out;
  }, [series, firstYear, lastYear]);

  const jan1 = toDay(`${lastYear}-01-01`);
  const lead = fromDay(jan1).getUTCDay();
  const picked = selected !== null ? series.byDay.get(selected) : undefined;

  return (
    <>
      <div className="grid-scroll" ref={scroller}>
        <div className="grid" onPointerLeave={tip.hide}>
          <div />
          <div className="months">
            {MONTHS.map((name, i) => {
              const d = toDay(`${lastYear}-${String(i + 1).padStart(2, "0")}-01`);
              return (
                <span key={name} style={{ gridColumn: `${Math.floor((d - jan1 + lead) / 7) + 1} / span 4`, gridRow: 1 }}>
                  {name}
                </span>
              );
            })}
          </div>
          {years.map(renderYear)}
        </div>
      </div>
      <div className="legend">
        None <i style={{ background: "#eef0ec" }} />
        <i style={{ background: "var(--c1)" }} />
        <i style={{ background: "var(--c2)" }} />
        <i style={{ background: "var(--c3)" }} /> 3+
        <span className="spacer" />
        <i style={{ background: "repeating-linear-gradient(135deg,#e2e3df 0 2px,transparent 2px 4px)" }} /> Not backfilled yet
      </div>
      {picked && (
        <ul className="list">
          {picked.map((e) => (
            <li key={e.title}>
              <time>{formatDay(e.day)}</time>
              <span className="title">
                {e.title}
                <span className="why">{e.why}</span>
              </span>
              <span className="org">{e.org}</span>
            </li>
          ))}
        </ul>
      )}
    </>
  );

  function renderYear({ year, count, lead, cells }: (typeof years)[number]) {
    return (
      <Fragment key={year}>
        <div className="yr">
          <b>{year}</b>
          {count}
        </div>
        <div
          className="cells"
          onPointerOver={(e) => {
            const day = Number((e.target as HTMLElement).dataset.day);
            if (!day) return tip.hide();
            const list = series.byDay.get(day);
            const body =
              day > series.asOf ? "Hasn't happened yet" : isUntracked(series, day) ? "Not backfilled yet" : list ? null : "Nothing";
            tip.show(
              <>
                <time>{formatDay(day, { weekday: "short", month: "short", day: "numeric", year: "numeric" })}</time>
                {body ?? list!.map((ev) => <b key={ev.title} style={{ display: "block" }}>{ev.title}</b>)}
              </>,
              e.clientX,
              e.clientY,
            );
          }}
          onClick={(e) => {
            const day = Number((e.target as HTMLElement).dataset.day);
            if (day && series.byDay.has(day)) setSelected(day);
          }}
        >
          {Array.from({ length: lead }, (_, k) => (
            <i key={`b${k}`} className="blank" />
          ))}
          {cells.map((c) => (
            <i key={c.day} data-day={c.day} className={`${c.cls}${c.day === selected ? " sel" : ""}`} />
          ))}
        </div>
      </Fragment>
    );
  }
}
