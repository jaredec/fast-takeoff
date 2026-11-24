"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import type { AiEvent } from "@/lib/metrics";

/** Whose breakthroughs to show: made by AI, made without it, or both side by side. */
export const WHO = [
  { id: "ai", label: "By AI" },
  { id: "human", label: "Without AI" },
  { id: "both", label: "Both" },
] as const;
export type Who = (typeof WHO)[number]["id"];

const WhoContext = createContext<[Who, (who: Who) => void]>(["ai", () => {}]);

/** Shares one choice between the timeline and the breakthroughs list. */
export function WhoProvider({ children }: { children: ReactNode }) {
  return <WhoContext value={useState<Who>("ai")}>{children}</WhoContext>;
}

export const useWho = () => useContext(WhoContext);

/** The breakthroughs `who` asks for, marking those made without AI. */
export function pick(who: Who, ai: AiEvent[], human: AiEvent[]): AiEvent[] {
  return [...(who === "human" ? [] : ai), ...(who === "ai" ? [] : human.map((e) => ({ ...e, human: true })))];
}

export function WhoSwitch() {
  const [who, setWho] = useWho();
  return (
    <span>
      {WHO.map((w) => (
        <button key={w.id} aria-pressed={w.id === who} onClick={() => setWho(w.id)}>
          {w.label}
        </button>
      ))}
    </span>
  );
}
