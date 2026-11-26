import type { AiEvent } from "./metrics";

/** A breakthrough's field. */
export const FIELDS = ["math", "biology", "medicine", "chemistry", "physics", "weather", "games", "vision"] as const;
export type Field = (typeof FIELDS)[number];

/**
 * Each breakthrough has its own icon at public/logos/bt-<icon>.svg: a Lucide or Tabler icon that fits that
 * breakthrough, stroked at 1.75 in its field's color.
 */
export const FIELD_COLORS: Record<Field, string> = {
  math: "#3f63a0",
  biology: "#3f8a4a",
  medicine: "#c0463a",
  chemistry: "#2a8a8a",
  physics: "#d07a34",
  weather: "#3b8bbf",
  games: "#424242",
  vision: "#6a5d8f",
};

/** The timeline colors the sciences by field and groups the rest (games, weather, vision) as "other". */
export const SCIENCES = ["math", "biology", "medicine", "chemistry", "physics"] as const satisfies readonly Field[];
export type FieldGroup = (typeof SCIENCES)[number] | "other";
export const FIELD_GROUPS: readonly FieldGroup[] = [...SCIENCES, "other"];
const OTHER_COLOR = "#8a8a8a";

export const fieldGroup = (f: Field): FieldGroup => ((SCIENCES as readonly Field[]).includes(f) ? (f as FieldGroup) : "other");
export const groupColor = (g: FieldGroup) => (g === "other" ? OTHER_COLOR : FIELD_COLORS[g]);

/** Fields for the Today page: the sciences, computer science, then plain labels for the rest, which show in gray. */
export const DAILY_FIELDS = [...SCIENCES, "computer science", "engineering", "software", "security", "history"] as const;
export type DailyField = (typeof DAILY_FIELDS)[number];
const CS_COLOR = "#7a5ca0";
export const fieldColor = (f: string) =>
  f === "computer science" ? CS_COLOR : (SCIENCES as readonly string[]).includes(f) ? FIELD_COLORS[f as Field] : OTHER_COLOR;

/** Lab marks in public/logos, for releases. Real marks only. */
export const LOGOS = [
  "anthropic", "claude", "copilot", "deepmind", "deepseek", "gemini", "gemma", "google", "grok", "ibm", "kimi",
  "meta", "microsoft", "midjourney", "mistral", "openai", "qwen", "stability", "xai", "zhipu",
] as const;
export type Logo = (typeof LOGOS)[number];

const BY_PRODUCT: [RegExp, Logo][] = [
  [/^Claude/, "claude"],
  [/^Gemini/, "gemini"],
  [/^Gemma/, "gemma"],
  [/^Grok/, "grok"],
  [/^Llama|^LLaMA|^Code Llama/, "meta"],
  [/^Qwen/, "qwen"],
  [/^Kimi/, "kimi"],
  [/Copilot/, "copilot"],
];

const BY_ORG: Record<string, Logo[]> = {
  OpenAI: ["openai"],
  Anthropic: ["anthropic"],
  Google: ["google"],
  DeepMind: ["deepmind"],
  "Google DeepMind": ["deepmind"],
  IBM: ["ibm"],
  Microsoft: ["microsoft"],
  Meta: ["meta"],
  xAI: ["xai"],
  Mistral: ["mistral"],
  Midjourney: ["midjourney"],
  Alibaba: ["qwen"],
  DeepSeek: ["deepseek"],
  "Moonshot AI": ["kimi"],
  "Zhipu AI": ["zhipu"],
  "Stability AI": ["stability"],
};

/** The image files (without .svg) shown for an event, most important first. Empty if nothing fits. */
export function logosFor(e: AiEvent): string[] {
  if (e.icon) return [`bt-${e.icon}`];
  const product = BY_PRODUCT.find(([re]) => re.test(e.title));
  if (product) return [product[1]];
  return BY_ORG[e.org] ?? [];
}

/** Real marks for credited groups on the Open problems page that aren't labs in BY_ORG. */
const GROUP_MARKS: Record<string, string> = {
  "Arc Institute": "/logos/arc-institute.png",
  FlyWire: "/logos/flywire.png",
};

/** The lab behind a model someone worked with, so credits show company marks like the lab credits beside them. */
const MODEL_LABS: [RegExp, Logo][] = [
  [/^Claude/, "anthropic"],
  [/^(Chat)?GPT|^Codex/, "openai"],
  [/^Gemini/, "google"],
  [/^Grok/, "xai"],
];

export type Mark = { src: string; label: string };

/**
 * The circles for one credit on the Open problems page: a lab's or group's mark, or else a generic avatar for a
 * person or a team avatar for several ("A and B"), then the mark of the lab whose model they worked with. A model
 * whose lab has no mark is left out.
 */
export function creditMarks(c: { name: string; with?: string }): Mark[] {
  const lab = BY_ORG[c.name]?.[0];
  const marks: Mark[] = lab
    ? [{ src: `/logos/${lab}.svg`, label: c.name }]
    : GROUP_MARKS[c.name]
      ? [{ src: GROUP_MARKS[c.name], label: c.name }]
      : [{ src: /, | and /.test(c.name) ? "/logos/people.svg" : "/logos/person.svg", label: c.name }];
  const modelLab = c.with ? MODEL_LABS.find(([re]) => re.test(c.with!))?.[1] : undefined;
  if (c.with && modelLab) marks.push({ src: `/logos/${modelLab}.svg`, label: c.with });
  return marks;
}
