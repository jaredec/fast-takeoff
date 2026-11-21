import type { AiEvent } from "./metrics";

/** A breakthrough's field, shown as its icon. Each has a file at public/logos/field-<name>.svg. */
export const FIELDS = ["math", "biology", "medicine", "chemistry", "physics", "weather", "games", "vision"] as const;
export type Field = (typeof FIELDS)[number];

/** Lab marks in public/logos, for releases. Real marks only. */
export const LOGOS = [
  "anthropic", "claude", "copilot", "deepmind", "deepseek", "gemini", "gemma", "google", "grok", "ibm", "kimi",
  "meta", "microsoft", "midjourney", "mistral", "openai", "qwen", "stability", "xai",
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
  "Stability AI": ["stability"],
};

/** The image files (without .svg) shown for an event, most important first. Empty if nothing fits. */
export function logosFor(e: AiEvent): string[] {
  if (e.field) return [`field-${e.field}`];
  const product = BY_PRODUCT.find(([re]) => re.test(e.title));
  if (product) return [product[1]];
  return BY_ORG[e.org] ?? [];
}
