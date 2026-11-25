"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type MouseEvent, type ReactNode } from "react";

/** The site's pages, shown one at a time and picked from the nav. */
const PAGES = [
  { id: "week", label: "Today" },
  { id: "breakthroughs", label: "Breakthroughs" },
  { id: "index", label: "Singularity Index" },
  { id: "timeline", label: "Timeline" },
] as const;
type Page = (typeof PAGES)[number]["id"];

function subscribe(onChange: () => void) {
  window.addEventListener("hashchange", onChange);
  window.addEventListener("popstate", onChange);
  return () => {
    window.removeEventListener("hashchange", onChange);
    window.removeEventListener("popstate", onChange);
  };
}

const fromHash = (hash: string): Page => PAGES.find((p) => `#${p.id}` === hash)?.id ?? PAGES[0].id;

export function Pages({ children }: { children: ReactNode }) {
  const page = fromHash(useSyncExternalStore(subscribe, () => location.hash, () => ""));
  const [open, setOpen] = useState(false);
  const nav = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (ev: PointerEvent) => {
      if (!nav.current?.contains(ev.target as Node)) setOpen(false);
    };
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const go = (ev: MouseEvent, id: Page) => {
    ev.preventDefault();
    setOpen(false);
    history.pushState(null, "", id === PAGES[0].id ? location.pathname + location.search : `#${id}`);
    window.dispatchEvent(new HashChangeEvent("hashchange"));
    window.scrollTo(0, 0);
  };

  return (
    <div className="page" data-page={page}>
      <nav className="pages" ref={nav} data-open={open || undefined}>
        {/* Phones show a menu button; wider screens list the pages instead. */}
        <div className="bar">
          <button type="button" aria-label={open ? "Close menu" : "Menu"} aria-expanded={open} aria-controls="page-links" onClick={() => setOpen(!open)}>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              {open ? <path d="M18 6 6 18M6 6l12 12" /> : <path d="M4 6h16M4 12h16M4 18h16" />}
            </svg>
          </button>
        </div>
        <div className="links" id="page-links">
          {PAGES.map((p) => (
            <a key={p.id} href={`#${p.id}`} aria-current={p.id === page ? "page" : undefined} onClick={(ev) => go(ev, p.id)}>
              {p.label}
            </a>
          ))}
        </div>
      </nav>
      {children}
    </div>
  );
}
