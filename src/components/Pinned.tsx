"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/** Scrolls with the page until its bottom reaches the bottom of the window, then stays put. */
export function Pinned({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [top, setTop] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fit = () => setTop(Math.min(0, innerHeight - el.offsetHeight));
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    addEventListener("resize", fit);
    return () => {
      ro.disconnect();
      removeEventListener("resize", fit);
    };
  }, []);
  return (
    <div ref={ref} className="pinned" style={{ top }}>
      {children}
    </div>
  );
}
