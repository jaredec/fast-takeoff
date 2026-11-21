"use client";

import { useState } from "react";
import { formatDay, type Series } from "@/lib/metrics";

export function RecentList({ series }: { series: Series }) {
  const [all, setAll] = useState(false);
  const newest = series.events.toReversed();
  const shown = all ? newest : newest.slice(0, 8);
  return (
    <>
      <ul className="list">
        {shown.map((e) => (
          <li key={e.date + e.title}>
            <time>{formatDay(e.day)}</time>
            <span className="title">
              {e.title}
              <span className="why">{e.why}</span>
            </span>
            <span className="org">{e.org}</span>
          </li>
        ))}
      </ul>
      {newest.length > 8 && (
        <p className="more">
          <button onClick={() => setAll(!all)}>{all ? "Show fewer" : `Show all ${newest.length}`}</button>
        </p>
      )}
    </>
  );
}
