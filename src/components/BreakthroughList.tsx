"use client";

import type { ReactNode } from "react";
import { formatDay, toDay, type AiEvent } from "@/lib/metrics";
import { pick, useWho, WhoSwitch, type Who } from "./Who";

const ABOUT: Record<Who, string> = {
  ai: "Firsts for humankind made by AI: new science, math or medicine, or a historic first the whole world noticed.",
  human:
    "Firsts for humankind made without AI since 2012, on the same terms, for comparison. The index counts only those made by AI.",
  both: "Firsts for humankind, made by AI and without it.",
};

export function BreakthroughList({ ai, human, children }: { ai: AiEvent[]; human: AiEvent[]; children: ReactNode }) {
  const [who] = useWho();
  const events = pick(who, ai, human)
    .map((e) => ({ ...e, day: toDay(e.date) }))
    .sort((a, b) => b.day - a.day);

  return (
    <section id="breakthroughs" className="side">
      <h2>Breakthroughs</h2>
      <p className="switch">
        <WhoSwitch />
      </p>
      <p>{ABOUT[who]}</p>
      <ul>
        {events.map((e) => (
          <li key={`${e.human ? "h" : "a"} ${e.date} ${e.title}`}>
            <b>{e.title}.</b> {e.why}{" "}
            <i>
              {who === "both" && e.human && "Without AI · "}
              {e.org}, {formatDay(e.day)}.
            </i>
          </li>
        ))}
      </ul>
      {children}
    </section>
  );
}
