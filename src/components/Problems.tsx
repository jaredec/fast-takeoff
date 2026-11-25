"use client";

import { useState } from "react";
import type { Problem } from "@/lib/data";
import { formatDay, toDay } from "@/lib/metrics";

/** ProofAtlas's 500 most important open problems in math, in its order, with who has settled each one since. */
export function Problems({ problems, updated }: { problems: Problem[]; updated: string }) {
  const [field, setField] = useState<string | null>(null);
  const counts = new Map<string, number>();
  for (const p of problems) counts.set(p.field, (counts.get(p.field) ?? 0) + 1);
  const fields = [...counts].sort((a, b) => b[1] - a[1]).map(([f]) => f);
  const shown = field ? problems.filter((p) => p.field === field) : problems;
  const settled = problems.filter((p) => p.status).length;

  return (
    <section id="problems">
      <p>
        The 500 most important open problems in math, in the order{" "}
        <a href="https://www.proofatlas.ai/" target="_blank" rel="noopener noreferrer">
          ProofAtlas
        </a>{" "}
        ranked them on October 6, 2026. {settled} have been settled since.
      </p>
      <p className="fields">
        {[null, ...fields].map((f) => (
          <button key={f ?? "all"} type="button" aria-pressed={f === field} onClick={() => setField(f)}>
            {f ?? "All"}
          </button>
        ))}
      </p>
      <ol>
        {shown.map((p) => (
          <li key={p.rank} value={p.rank}>
            <b>{p.title}.</b>
            {p.status && p.by && (
              <i>
                {" "}
                {p.status} by{" "}
                {p.by.map((c, i) => (
                  <span key={c.name}>
                    {i ? " and " : ""}
                    <a href={c.url} target="_blank" rel="noopener noreferrer">
                      {c.name}
                    </a>
                  </span>
                ))}
                .
              </i>
            )}
          </li>
        ))}
      </ol>
      <p className="note">
        Settled problems as tracked by the{" "}
        <a href="https://top500.konsti.xyz" target="_blank" rel="noopener noreferrer">
          Top 500 map
        </a>
        , last updated {formatDay(toDay(updated), { month: "long", day: "numeric" })}.
      </p>
    </section>
  );
}
