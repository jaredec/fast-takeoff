"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";

/** The site's pages, shown one at a time and picked from the nav. */
const PAGES = [
  { href: "/", label: "Today" },
  { href: "/breakthroughs", label: "Breakthroughs" },
  { href: "/problems", label: "Open problems" },
] as const;

export function Pages({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const nav = useRef<HTMLElement>(null);

  // Old links pointed at /#breakthroughs and /#problems.
  useEffect(() => {
    const old = PAGES.find((p) => p.href !== "/" && `#${p.href.slice(1)}` === location.hash);
    if (old) router.replace(old.href);
  }, [router]);

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

  return (
    <div className="page">
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
            <Link key={p.href} href={p.href} aria-current={p.href === pathname ? "page" : undefined} onClick={() => setOpen(false)}>
              {p.label}
            </Link>
          ))}
        </div>
      </nav>
      <div className="cols">{children}</div>
    </div>
  );
}
