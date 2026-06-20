/**
 * Provider-agnostic contract for text generation.
 *
 * Both the WaveSpeed (`wavespeed/wavespeed-llm`) and OpenRouter
 * (`openrouter/openrouter-llm`) implementations conform to this shape so the
 * rest of the app can switch providers without changing call sites. The active
 * provider is selected in `llm/index.ts`.
 */
export interface GenerateTextOptions {
  prompt: string;
  systemPrompt?: string;
  /**
   * Underlying model id. The accepted format is provider-specific
   * (e.g. WaveSpeed routes "openai/gpt-5-chat"; OpenRouter uses ids like
   * "openai/gpt-4o-mini"). When omitted, each provider applies its own default.
   */
  model?: string;
  temperature?: number;
  maxTokens?: number;
  /** WaveSpeed-only routing hint; ignored by providers that don't support it. */
  priority?: "latency" | "throughput";
  reasoning?: boolean;
}

/** A text-generation provider: prompt in, completion string out. */
export type GenerateText = (options: GenerateTextOptions) => Promise<string>;
