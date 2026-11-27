/**
 * The hourly finder: pulls what's new from free feeds and a few DeepSeek searches, has DeepSeek Flash keep only
 * items that might clear the Today page's bar, and queues them on the `finder` branch for Claude to check.
 * Without DEEPSEEK_API_KEY it only prints what the free feeds returned.
 */
import { readFileSync } from "node:fs";
import {
  etDay,
  readCandidates,
  readSeen,
  readStatus,
  setOutput,
  urlKey,
  writeCandidates,
  writeSeen,
  type Candidate,
} from "./state";

type Item = { url: string; title: string; source: string; date?: string; summary?: string };

const WINDOW_DAYS = 3;
const SEEN_DAYS = 30;
const MIN_GAP_HOURS = Number(process.env.MIN_GAP_HOURS ?? 3);
const MAX_RUNS_PER_DAY = Number(process.env.MAX_RUNS_PER_DAY ?? 5);
const SEARCHES_PER_RUN = 6;
const KEY = process.env.DEEPSEEK_API_KEY;
const now = new Date();
const since = new Date(now.getTime() - WINDOW_DAYS * 864e5);
const recent = (d?: string) => !d || Number.isNaN(Date.parse(d)) || new Date(d) >= since;

const SEARCHES = [
  "AI proves open conjecture",
  "GPT-6 proof open problem mathematician",
  "Claude proof conjecture mathematician",
  "Gemini solves open problem",
  "Erdős problem solved AI",
  "AI discovered new antibiotic",
  "AI designed drug clinical result",
  "AI discovers new material",
  "AI agent finds vulnerability zero-day",
  "AI physics discovery paper",
  "Lean formalization AI proof",
  "AI biology discovery protein",
  "AI-assisted proof arXiv",
  "site:anthropic.com research",
  "AI real-world first record",
  "AI chip design autonomous",
  "AlphaProof AlphaEvolve new result",
  "AI found counterexample conjecture",
];

const RSS = [
  ["OpenAI", "https://openai.com/news/rss.xml"],
  ["Google DeepMind", "https://deepmind.google/blog/rss.xml"],
  ["Google Research", "https://research.google/blog/rss/"],
  ["Google AI blog", "https://blog.google/technology/ai/rss/"],
] as const;

const REPOS = [
  ["openai/math", ""],
  ["google-research/google-research", "cogentic_research_papers"],
  ["anthropics/formal-math", ""],
] as const;

const ARXIV_QUERY =
  '(abs:"GPT-6" OR abs:"GPT-5" OR abs:"Claude" OR abs:"Gemini" OR abs:"AlphaProof" OR abs:"AlphaEvolve" OR abs:"large language model" OR abs:"AI-assisted") AND ' +
  "(cat:math.* OR cat:cs.CC OR cat:cs.DS OR cat:cs.DM OR cat:quant-ph OR cat:hep-th OR cat:gr-qc OR cat:cond-mat.* OR cat:physics.* OR cat:q-bio.*)";

async function get(url: string, headers: Record<string, string> = {}) {
  const res = await fetch(url, { headers: { "user-agent": "todayinai-finder", ...headers }, signal: AbortSignal.timeout(30_000) });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res;
}

const tag = (xml: string, name: string) =>
  xml.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`))?.[1]?.replace(/<!\[CDATA\[|\]\]>/g, "").trim() ?? "";
const clean = (s: string) => s.replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, " ").trim();

async function arxiv(): Promise<Item[]> {
  const url = `https://export.arxiv.org/api/query?search_query=${encodeURIComponent(ARXIV_QUERY)}&sortBy=submittedDate&sortOrder=descending&max_results=80`;
  const xml = await (await get(url)).text();
  return [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)].map(([, e]) => ({
    url: tag(e, "id"),
    title: clean(tag(e, "title")),
    source: "arXiv",
    date: tag(e, "published"),
    summary: clean(tag(e, "summary")).slice(0, 600),
  }));
}

async function rss(): Promise<Item[]> {
  const out: Item[] = [];
  for (const [source, url] of RSS) {
    try {
      const xml = await (await get(url)).text();
      for (const [, e] of xml.matchAll(/<item>([\s\S]*?)<\/item>/g))
        out.push({ url: clean(tag(e, "link")), title: clean(tag(e, "title")), source, date: tag(e, "pubDate"), summary: clean(tag(e, "description")).slice(0, 400) });
    } catch (e) {
      console.warn(`rss ${source}: ${(e as Error).message}`);
    }
  }
  return out;
}

async function repos(): Promise<Item[]> {
  const headers: Record<string, string> = { accept: "application/vnd.github+json" };
  if (process.env.GITHUB_TOKEN) headers.authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  const out: Item[] = [];
  for (const [repo, dir] of REPOS) {
    try {
      const url = `https://api.github.com/repos/${repo}/commits?since=${since.toISOString()}&per_page=30${dir ? `&path=${dir}` : ""}`;
      const commits = (await (await get(url, headers)).json()) as { html_url: string; commit: { message: string; author: { date: string } } }[];
      for (const c of commits)
        out.push({ url: c.html_url, title: `${repo}: ${c.commit.message.split("\n")[0]}`, source: `GitHub ${repo}`, date: c.commit.author.date, summary: c.commit.message.slice(0, 400) });
    } catch (e) {
      console.warn(`github ${repo}: ${(e as Error).message}`);
    }
  }
  return out;
}

async function hackerNews(): Promise<Item[]> {
  const res = (await (await get("https://hn.algolia.com/api/v1/search?tags=front_page&hitsPerPage=80")).json()) as {
    hits: { title: string; url?: string; objectID: string; created_at: string }[];
  };
  return res.hits.map((h) => ({ url: h.url ?? `https://news.ycombinator.com/item?id=${h.objectID}`, title: h.title, source: "Hacker News", date: h.created_at }));
}

async function search(): Promise<Item[]> {
  if (!KEY) return [];
  const start = (now.getUTCHours() * SEARCHES_PER_RUN) % SEARCHES.length;
  const queries = Array.from({ length: SEARCHES_PER_RUN }, (_, i) => SEARCHES[(start + i) % SEARCHES.length]);
  const out: Item[] = [];
  for (const query of queries) {
    try {
      const res = await fetch("https://api.deepseek.com/v1/tools/search", {
        method: "POST",
        headers: { authorization: `Bearer ${KEY}`, "content-type": "application/json" },
        body: JSON.stringify({ query, count: 10 }),
        signal: AbortSignal.timeout(30_000),
      });
      if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
      const { results } = (await res.json()) as { results: { url: string; title: string; summary: string; date: string | null; rerank_score: number }[] };
      for (const r of results)
        if (r.date || r.rerank_score >= 1.5) out.push({ url: r.url, title: r.title, source: `search: ${query}`, date: r.date ?? undefined, summary: r.summary.slice(0, 500) });
    } catch (e) {
      console.warn(`search "${query}": ${(e as Error).message}`);
    }
  }
  return out;
}

/** The Today page's bar, straight from AGENTS.md so the finder and Claude judge by the same words. */
function bar() {
  const agents = readFileSync("AGENTS.md", "utf8");
  return agents
    .split("\n")
    .filter((l) => l.startsWith("- A breakthrough is") || l.startsWith("- `data/daily.json` feeds"))
    .join("\n");
}

function onSite() {
  const entries = [
    ...(JSON.parse(readFileSync("data/daily.json", "utf8")) as { date: string; title: string; url?: string }[]),
    ...(JSON.parse(readFileSync("data/breakthroughs.json", "utf8")) as { date: string; title: string; url?: string }[]),
  ];
  const cutoff = new Date(now.getTime() - 21 * 864e5).toISOString().slice(0, 10);
  return {
    urls: new Set(entries.flatMap((e) => (e.url ? [urlKey(e.url)] : []))),
    recent: entries.filter((e) => e.date >= cutoff).map((e) => `${e.date} ${e.title}${e.url ? ` (${e.url})` : ""}`),
  };
}

async function judge(items: Item[], recentEntries: string[], pending: Candidate[]) {
  const system = [
    "You screen news for Today in AI, a site that logs what AI itself achieved each day. Here is its bar:",
    bar(),
    "Keep only items that might clear this bar: a new result, discovery, real-world first or record, or a notable thing an agent did on its own.",
    "Drop model launches, products, funding, policy, opinion, tutorials, benchmarks, and anything already on the site or already pending.",
    "When unsure, keep it; a careful editor checks every item you keep. Mark urgent only for something that could be a historic breakthrough.",
    'Reply with JSON: {"candidates":[{"url":"...","title":"short subject","note":"one line on what was shown and by whom","urgent":false}]}. Use an empty list when nothing qualifies.',
  ].join("\n\n");
  const user = [
    `Already on the site (last three weeks):\n${recentEntries.join("\n")}`,
    `Already pending:\n${pending.map((c) => `${c.title} (${c.url})`).join("\n") || "none"}`,
    `New items:\n${items.map((i, n) => `${n + 1}. [${i.source}] ${i.title}\n${i.url}${i.date ? `\n${i.date}` : ""}${i.summary ? `\n${i.summary}` : ""}`).join("\n\n")}`,
  ].join("\n\n");
  const res = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: { authorization: `Bearer ${KEY}`, "content-type": "application/json" },
    body: JSON.stringify({
      model: "deepseek-flash",
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      response_format: { type: "json_object" },
    }),
    signal: AbortSignal.timeout(180_000),
  });
  if (!res.ok) throw new Error(`deepseek ${res.status} ${await res.text()}`);
  const body = (await res.json()) as { choices: { message: { content: string } }[] };
  const parsed = JSON.parse(body.choices[0].message.content) as { candidates?: Omit<Candidate, "source" | "foundAt">[] };
  const byUrl = new Map(items.map((i) => [urlKey(i.url), i]));
  return (parsed.candidates ?? [])
    .filter((c) => c.url && byUrl.has(urlKey(c.url)))
    .map((c) => ({ url: c.url, title: c.title, note: c.note, urgent: !!c.urgent, source: byUrl.get(urlKey(c.url))!.source, foundAt: now.toISOString() }));
}

async function main() {
  const results = await Promise.allSettled([arxiv(), rss(), repos(), hackerNews(), search()]);
  const items: Item[] = [];
  for (const r of results) {
    if (r.status === "fulfilled") items.push(...r.value);
    else console.warn(r.reason);
  }

  const seen = readSeen();
  const site = onSite();
  const fresh = new Map<string, Item>();
  for (const i of items) {
    const key = urlKey(i.url);
    if (!i.url || !recent(i.date) || seen[key] || site.urls.has(key) || fresh.has(key)) continue;
    fresh.set(key, i);
  }
  console.log(`${items.length} items, ${fresh.size} new`);

  if (!KEY) {
    for (const i of fresh.values()) console.log(`- [${i.source}] ${i.title}\n  ${i.url}`);
    console.log("No DEEPSEEK_API_KEY: dry run, state unchanged.");
    return;
  }

  const pending = readCandidates();
  const list = [...fresh.values()];
  const found: Candidate[] = [];
  for (let n = 0; n < list.length; n += 60) found.push(...(await judge(list.slice(n, n + 60), site.recent, pending)));

  const pendingKeys = new Set(pending.map((c) => urlKey(c.url)));
  const added = found.filter((c) => !pendingKeys.has(urlKey(c.url)));
  const candidates = [...pending, ...added];
  for (const key of fresh.keys()) seen[key] = now.toISOString();
  const cutoff = now.getTime() - SEEN_DAYS * 864e5;
  for (const [key, at] of Object.entries(seen)) if (Date.parse(at) < cutoff) delete seen[key];
  writeSeen(seen);
  writeCandidates(candidates);
  for (const c of added) console.log(`+ ${c.urgent ? "[urgent] " : ""}${c.title}: ${c.note}\n  ${c.url}`);

  const status = readStatus();
  const runsToday = status.curateDay === etDay(now) ? (status.curateRuns ?? 0) : 0;
  const hoursSince = status.lastCurate ? (now.getTime() - Date.parse(status.lastCurate)) / 36e5 : Infinity;
  const due = candidates.length > 0 && runsToday < MAX_RUNS_PER_DAY && (hoursSince >= MIN_GAP_HOURS || candidates.some((c) => c.urgent));
  setOutput("curate", due ? "true" : "false");
  setOutput("pending", String(candidates.length));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
