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
