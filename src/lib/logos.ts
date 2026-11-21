import type { AiEvent } from "./metrics";

/** Files in public/logos. Real marks only: an event with no company gets a pictogram via `image`. */
export const LOGOS = [
  "anthropic", "claude", "copilot", "deepmind", "deepseek", "gan", "gemini", "gemma", "google", "grok", "ibm",
  "kimi", "meta", "microsoft", "midjourney", "mistral", "nobel", "openai", "qwen", "stability", "vision", "xai",
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
  "DeepMind and EMBL": ["deepmind"],
  "OpenAI and Google DeepMind": ["openai", "deepmind"],
  IBM: ["ibm"],
  "Microsoft Research": ["microsoft"],
  Meta: ["meta"],
  xAI: ["xai"],
  Mistral: ["mistral"],
  Midjourney: ["midjourney"],
  Alibaba: ["qwen"],
  DeepSeek: ["deepseek"],
  "Moonshot AI": ["kimi"],
  "Stability AI": ["stability"],
};

/** The marks shown for an event, most important first. Empty if nothing fits. */
export function logosFor(e: AiEvent): Logo[] {
  if (e.image) return [e.image as Logo];
  const product = BY_PRODUCT.find(([re]) => re.test(e.title));
  if (product) return [product[1]];
  return BY_ORG[e.org] ?? [];
}
