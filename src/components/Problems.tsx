"use client";

import { useState } from "react";
import type { Problem } from "@/lib/data";
import { creditMarks } from "@/lib/logos";

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
      <p>Great open problems in math and science now coming within reach.</p>
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
                  <span className="faces">
                    {p.by.map((c) => (
                      <span key={c.name} className="credit">
                        <a href={c.url} target="_blank" rel="noopener noreferrer" aria-label={c.with ? `${c.name} with ${c.with}` : c.name}>
                          {creditMarks(c).map((m) => (
                            // eslint-disable-next-line @next/next/no-img-element -- tiny static marks
                            <img key={m.label} src={m.src} alt="" />
                          ))}
                        </a>
                        <span className="card" aria-hidden="true">
                          {c.with ? `${c.name} with ${c.with}` : c.name}
                        </span>
                      </span>
                    ))}
                  </span>
                </i>
              )}
            </li>
          ))}
      </ol>
    </section>
  );
}
