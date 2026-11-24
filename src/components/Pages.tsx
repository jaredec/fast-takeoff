"use client";

import { useSyncExternalStore, type MouseEvent, type ReactNode } from "react";

/** On phones the page splits into these, one at a time; wider screens show everything at once. */
const PAGES = [
  { id: "index", label: "Singularity Index" },
  { id: "timeline", label: "Timeline" },
  { id: "breakthroughs", label: "Breakthroughs" },
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

const fromHash = (hash: string): Page => PAGES.find((p) => `#${p.id}` === hash)?.id ?? "index";

export function Pages({ children }: { children: ReactNode }) {
  const page = fromHash(useSyncExternalStore(subscribe, () => location.hash, () => ""));

  const go = (ev: MouseEvent, id: Page) => {
    ev.preventDefault();
    history.pushState(null, "", id === "index" ? location.pathname + location.search : `#${id}`);
    window.dispatchEvent(new HashChangeEvent("hashchange"));
    window.scrollTo(0, 0);
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
