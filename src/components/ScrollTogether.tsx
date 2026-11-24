"use client";

import { useEffect } from "react";

/** Scrolling outside the columns moves both of them at once, like one page; inside a column it moves only that one. */
export function ScrollTogether() {
  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      if (!e.deltaY || e.ctrlKey || (e.target as Element).closest?.(".side")) return;
      const panes = [...document.querySelectorAll<HTMLElement>(".side")];
      if (!panes.length || getComputedStyle(panes[0]).overflowY !== "auto") return;
      e.preventDefault();
      for (const p of panes) {
        const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? p.clientHeight : 1;
        p.scrollBy({ top: e.deltaY * unit, behavior: "instant" });
      }
    };
    window.addEventListener("wheel", onWheel, { passive: false });
    return () => window.removeEventListener("wheel", onWheel);
  }, []);
  return null;
}
