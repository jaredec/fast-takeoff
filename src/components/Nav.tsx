"use client";

import { Activity, CalendarDays, ChartScatter, Clock, Gauge, Layers, Menu, type LucideIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { BASE_PATH } from "@/lib/basePath";
import { formatDay, TRACK_INFO, TRACKS, type Series, type Track } from "@/lib/metrics";

export const SECTIONS: { id: string; label: string; icon: LucideIcon }[] = [
  { id: "index", label: "Index", icon: Gauge },
  { id: "timeline", label: "Timeline", icon: ChartScatter },
  { id: "speed", label: "Speed", icon: Activity },
  { id: "every-day", label: "Every day", icon: CalendarDays },
];

export function Header({ onMenu }: { onMenu: () => void }) {
  return (
    <header className="bar">
      <button className="bar-menu" aria-label="Menu" onClick={onMenu}>
        <Menu size={22} strokeWidth={1.75} />
      </button>
      <a className="bar-title" href={BASE_PATH}>
        Fast Takeoff
      </a>
      <a className="bar-right" href="https://x.com/thefasttakeoff">
        Follow
      </a>
    </header>
  );
}

function useActiveSection() {
  const [active, setActive] = useState(SECTIONS[0].id);
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        const hit = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (hit) setActive(hit.target.id);
      },
      { rootMargin: "-80px 0px -55% 0px" },
    );
    for (const s of SECTIONS) {
      const el = document.getElementById(s.id);
      if (el) io.observe(el);
    }
    return () => io.disconnect();
  }, []);
  return active;
}

export function Sidebar({
  onClose,
  track,
  onTrack,
  series,
}: {
  onClose: () => void;
  track: Track;
  onTrack: (t: Track) => void;
  series: Series;
}) {
  const active = useActiveSection();
  const latest = series.events.slice(-4).reverse();

  return (
    <>
      <div className="scrim" onClick={onClose} />
      <nav className="side" aria-label="Sections">
        {SECTIONS.map(({ id, label, icon: Icon }) => (
          <a key={id} href={`#${id}`} className="side-item" aria-current={active === id} onClick={onClose}>
            <Icon size={21} strokeWidth={1.5} />
            {label}
          </a>
        ))}

        <div className="side-item side-group">
          <Layers size={21} strokeWidth={1.5} />
          Tracks
        </div>
        {TRACKS.map((t) => (
          <button key={t} className="side-sub" aria-pressed={t === track} onClick={() => onTrack(t)}>
            {TRACK_INFO[t].label}
          </button>
        ))}

        <div className="side-item side-group">
          <Clock size={21} strokeWidth={1.5} />
          Latest
        </div>
        {latest.map((e) => (
          <a key={`${e.date}-${e.title}`} href="#timeline" className="side-event" onClick={onClose}>
            <span>{e.title}</span>
            <small>
              {formatDay(e.day, { weekday: "short", month: "short", day: "numeric" })} • {e.org}
            </small>
          </a>
        ))}

        <hr />
        <a className="side-sub" href="https://x.com/thefasttakeoff">
          Follow on X
        </a>
        <a className="side-sub" href={`${BASE_PATH}/card/${track}/month`}>
          Today&rsquo;s card
        </a>
        <a className="side-sub" href="https://www.jaredconnolly.com">
          Jared Connolly
        </a>
      </nav>
    </>
  );
}
