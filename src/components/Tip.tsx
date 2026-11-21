"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

type TipApi = { show: (content: ReactNode, x: number, y: number) => void; hide: () => void };

const TipContext = createContext<TipApi>({ show: () => {}, hide: () => {} });

export const useTip = () => useContext(TipContext);

const TIP_WIDTH = 272;

export function TipProvider({ children }: { children: ReactNode }) {
  const [tip, setTip] = useState<{ content: ReactNode; x: number; y: number } | null>(null);
  const api = useMemo<TipApi>(
    () => ({ show: (content, x, y) => setTip({ content, x, y }), hide: () => setTip(null) }),
    [],
  );
  return (
    <TipContext.Provider value={api}>
      {children}
      {tip && (
        <div
          className="tip"
          role="tooltip"
          style={{
            left: Math.max(8, Math.min(tip.x + 14, window.innerWidth - TIP_WIDTH - 8)),
            top: tip.y > window.innerHeight * 0.7 ? tip.y - 12 : tip.y + 16,
            transform: tip.y > window.innerHeight * 0.7 ? "translateY(-100%)" : undefined,
          }}
        >
          {tip.content}
        </div>
      )}
    </TipContext.Provider>
  );
}
