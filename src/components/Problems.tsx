"use client";

import { useState } from "react";
import type { Problem } from "@/lib/data";

const SUBJECTS = [
  { id: "math", label: "Math" },
  { id: "physics", label: "Physics" },
  { id: "chemistry", label: "Chemistry" },
  { id: "biology", label: "Biology" },
  { id: "medicine", label: "Medicine" },
] as const;

/** Our ranking of reachable open problems in each science, with who has solved each one. */
export function Problems({ problems }: { problems: Problem[] }) {
  const [field, setField] = useState<Problem["field"]>("math");

  return (
    <section id="problems">
      <p>Open problems in each science that are within reach, biggest first.</p>
      <p className="fields">
        {SUBJECTS.map((s) => (
          <button key={s.id} type="button" aria-pressed={s.id === field} onClick={() => setField(s.id)}>
            {s.label}
          </button>
        ))}
      </p>
      <ol>
        {problems
          .filter((p) => p.field === field)
          .map((p) => (
            <li key={p.title}>
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
    </section>
  );
}
