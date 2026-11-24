"use client";

import { useSyncExternalStore, type MouseEvent, type ReactNode } from "react";

/**
 * On phones the page splits into these, one at a time. Wider screens show everything at once, and the
 * same links in a nav beside the columns scroll to each part.
 */
const PAGES = [
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

const fromHash = (hash: string): Page => PAGES.find((p) => `#${p.id}` === hash)?.id ?? "breakthroughs";

export function Pages({ children }: { children: ReactNode }) {
  const page = fromHash(useSyncExternalStore(subscribe, () => location.hash, () => ""));

  const go = (ev: MouseEvent, id: Page) => {
    ev.preventDefault();
    history.pushState(null, "", id === "breakthroughs" ? location.pathname + location.search : `#${id}`);
    window.dispatchEvent(new HashChangeEvent("hashchange"));
    window.scrollTo(0, 0);
    const el = document.getElementById(id);
    if (!el || !matchMedia("(min-width: 721px)").matches) return;
    if (el.classList.contains("side")) el.scrollTo({ top: 0, behavior: "smooth" });
    else el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="page" data-page={page}>
      <nav className="pages">
        {PAGES.map((p) => (
          <a key={p.id} href={`#${p.id}`} aria-current={p.id === page ? "page" : undefined} onClick={(ev) => go(ev, p.id)}>
            {p.label}
          </a>
        ))}
      </nav>
      {children}
    </div>
  );
}
