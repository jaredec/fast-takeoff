"use client";

import { useEffect, useState } from "react";

export const SECTIONS = [
  { id: "index", label: "The index" },
  { id: "timeline", label: "Timeline" },
  { id: "speed", label: "Speed over time" },
  { id: "every-day", label: "Every day" },
  { id: "recent", label: "Recent" },
  { id: "post", label: "The daily post" },
  { id: "method", label: "What counts" },
];

export function Toc({ asOf }: { asOf: string }) {
  const [active, setActive] = useState("index");
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        const top = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (top) setActive(top.target.id);
      },
      { rootMargin: "0px 0px -65% 0px" },
    );
    for (const s of SECTIONS) {
      const el = document.getElementById(s.id);
      if (el) io.observe(el);
    }
    return () => io.disconnect();
  }, []);
  return (
    <aside className="toc">
      <p className="toc-title">Fast Takeoff</p>
      <p className="toc-meta">Tracked daily · {asOf}</p>
      <ol>
        {SECTIONS.map((s) => (
          <li key={s.id}>
            <a href={`#${s.id}`} aria-current={s.id === active}>
              {s.label}
            </a>
          </li>
        ))}
      </ol>
      <span className="badge">Mock data</span>
    </aside>
  );
}
