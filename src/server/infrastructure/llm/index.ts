import { generateText as openrouterGenerateText } from "../openrouter/openrouter-llm";
import { generateText as wavespeedGenerateText } from "../wavespeed/wavespeed-llm";
import type { GenerateText, GenerateTextOptions } from "./types";

export type { GenerateText, GenerateTextOptions } from "./types";

export type LlmProvider = "wavespeed" | "openrouter";

const PROVIDERS: Record<LlmProvider, GenerateText> = {
  wavespeed: wavespeedGenerateText,
  openrouter: openrouterGenerateText,
};

/** Default provider; preserves existing behavior when `LLM_PROVIDER` is unset. */
const DEFAULT_PROVIDER: LlmProvider = "openrouter";

function resolveProvider(): LlmProvider {
  const raw = (process.env.LLM_PROVIDER ?? "").trim().toLowerCase();
  return raw in PROVIDERS ? (raw as LlmProvider) : DEFAULT_PROVIDER;
}

/**
 * Generates text using the LLM provider selected via the `LLM_PROVIDER`
 * environment variable ("wavespeed" or "openrouter"). Unknown/unset values fall
 * back to {@link DEFAULT_PROVIDER}.
 */
export function generateText(options: GenerateTextOptions): Promise<string> {
  return PROVIDERS[resolveProvider()](options);
}
