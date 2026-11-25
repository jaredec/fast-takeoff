import { writeFileSync } from "node:fs";

/**
 * Rebuilds data/problems.json from the Top 500 map (top500.konsti.xyz), which keeps ProofAtlas's October 6 ranking
 * of the 500 most important open problems in math and marks each one solved since, with links to the proofs.
 */
const SOURCE = "https://top500.konsti.xyz/proofatlas_top500_status.data.json";

const FIELD: Record<string, string> = {
  "Number theory & arithmetic geometry": "Number theory",
  "Geometry & topology": "Geometry",
  "Algebraic geometry": "Geometry",
  "Theoretical computer science": "Computer science",
  "Algebra, representation & category theory": "Algebra",
  "Group theory": "Algebra",
  "Representation theory": "Algebra",
  "Analysis & PDE": "Analysis",
  Analysis: "Analysis",
  "Probability, ergodic theory & dynamics": "Probability",
  "Combinatorics & discrete geometry": "Combinatorics",
  "Cryptography, coding, information & optimization": "Cryptography & optimization",
  "Mathematical physics": "Physics",
  "Logic, foundations & set theory": "Logic",
  "Algebra & logic": "Logic",
  "Quantum information & computation": "Quantum computing",
  "Applied & computational mathematics": "Applied math",
};

const STATUS: Record<string, string> = {
  proved: "Solved",
  proved_claim: "Solved",
  "Announced proof": "Solved",
  "Consequence of announced proof": "Solved",
  "Additional consequence of announced GRH proof": "Solved",
  claimed_pending_refereeing: "Solved",
  determined: "Solved",
  disproved: "Disproved",
  disproved_claim: "Disproved",
  relative_independence: "Shown independent",
};

/** Where OpenAI's sources list several of its papers, the one that settles the problem. */
const OPENAI_PAPER: Record<number, string> = {
  28: "The-matrix-multiplication-exponent-is-nine-fourths-November-24-2026",
  62: "Circuit-lower-bounds-for-Hamiltonian-cycle-and-the-permanent-November-24-2026",
  145: "a-torsion-free-hyperbolic-group-that-is-not-residually-finite-September-23-2026",
  183: "Smooth-Anisotropic-Uniqueness-in-the-Calderon-Problem-from-One-Boundary-Patch-September-24-2026",
  239: "Universal-optimality-of-the-triangular-lattice-September-23-2026",
  254: "A-Limiting-Satisfiability-Threshold-for-Every-Fixed-Clause-Size-September-25-2026",
  289: "Smooth-counterexamples-to-Yaus-nodal-upper-bound-in-dimensions-three-and-four-September-23-2026",
  305: "Rigidity-of-Smooth-Billiards-with-a-Continuous-Caustic-Collar-September-24-2026",
  334: "The-logarithmic-exponent-of-finite-Fourier-transforms-November-24-2026",
  358: "A-hyperbolic-group-with-no-geometric-CAT0-action-September-25-2026",
  392: "Almost-everywhere-regularity-of-stationary-integral-varifolds-September-23-2026",
  468: "Ergodicity-of-triangular-billiards-with-an-irrational-angle-September-25-2026",
  476: "Strongly-polynomial-linear-programming-November-24-2026",
  484: "Boundedness-and-persistence-of-weakly-reversible-mass-action-systems-September-25-2026",
};

/** Problems solved by people the map names rather than a lab, credited as their sources do. */
const PEOPLE: Record<number, { name: string; url: string }> = {
  95: { name: "Bizeul–Klartag–Lehec and Song–Zhang", url: "https://arxiv.org/abs/2610.01447v1" },
  228: { name: "Radchenko and Wheeler", url: "https://www.danrad.net/papers/stark-reciprocity.pdf" },
  337: { name: "the ℤℚ Diophantine Project", url: "https://github.com/elliotglazer/diophantine-z-q" },
};

type Record_ = { rank: number; title: string; subject: string; status: string; outcome: string; credits: string[]; sources: string[] };

function openaiPaper(r: Record_) {
  const papers = r.sources.filter((s) => /github\.com\/openai\/math\/blob\/[^/]+\/preprints\//.test(s));
  const want = OPENAI_PAPER[r.rank];
  const url = want ? papers.find((s) => s.includes(`/preprints/${want}/`)) : papers[0];
  return url ?? r.sources.find((s) => s.includes("openai.com"));
}

function anthropicSource(r: Record_) {
  return (
    r.sources.find((s) => s.includes("alpo.ge")) ??
    r.sources.find((s) => /github\.com\/anthropics\/.*README\.md$/.test(s)) ??
    r.sources.find((s) => s.includes("github.com/anthropics"))
  );
}

function credits(r: Record_) {
  if (PEOPLE[r.rank]) return [PEOPLE[r.rank]];
  return r.credits
    .filter((c) => c !== "Human")
    .map((c) => {
      if (c === "OpenAI") return { name: "OpenAI", url: openaiPaper(r) };
      if (c === "Anthropic") return { name: "Anthropic", url: anthropicSource(r) };
      if (c === "PSI") return { name: "Physical Superintelligence", url: r.sources.find((s) => s.includes("physical-superintelligence")) };
      throw new Error(`#${r.rank}: unknown credit ${c}`);
    });
}

async function main() {
  const data = (await (await fetch(SOURCE)).json()) as { metadata: { updated: string }; records: Record_[] };
  const problems = data.records
    .sort((a, b) => a.rank - b.rank)
    .map((r) => {
      const field = FIELD[r.subject];
      if (!field) throw new Error(`#${r.rank}: no field for ${r.subject}`);
      if (r.status !== "full_claim") return { rank: r.rank, title: r.title, field };
      const status = STATUS[r.outcome];
      if (!status) throw new Error(`#${r.rank}: unknown outcome ${r.outcome}`);
      const by = credits(r);
      for (const c of by) if (!c.url) throw new Error(`#${r.rank}: no source for ${c.name}`);
      return { rank: r.rank, title: r.title, field, status, by };
    });

  writeFileSync("data/problems.json", `${JSON.stringify({ updated: data.metadata.updated, problems }, null, 1)}\n`);
  console.log(`${problems.length} problems, ${problems.filter((p) => "status" in p).length} settled, as of ${data.metadata.updated}`);
}

main();
