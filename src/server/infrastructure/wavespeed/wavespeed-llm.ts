import { Client } from "wavespeed";

const MODEL_ENDPOINT = "wavespeed-ai/any-llm";
const DEFAULT_LLM = "openai/gpt-5-chat";

export interface GenerateTextOptions {
  prompt: string;
  systemPrompt?: string;
  /** Underlying LLM to route to (e.g. "openai/gpt-5-chat"). */
  model?: string;
  temperature?: number;
  maxTokens?: number;
  priority?: "latency" | "throughput";
  reasoning?: boolean;
}

/**
 * Generates text via WaveSpeed's `any-llm` endpoint and returns the raw
 * completion string.
 *
 * The SDK reads `WAVESPEED_API_KEY` from the environment and polls the task to
 * completion, so `outputs` is populated by the time `run` resolves. For text
 * models the completion is returned inline; some deployments instead return a
 * URL pointing at the text, which we transparently fetch.
 */
export async function generateText({
  prompt,
  systemPrompt,
  model = DEFAULT_LLM,
  temperature,
  maxTokens,
  priority = "throughput",
  reasoning = false,
}: GenerateTextOptions): Promise<string> {
  const client = new Client();

  const result = await client.run(MODEL_ENDPOINT, {
    enable_sync_mode: false,
    model,
    priority,
    reasoning,
    prompt,
    ...(systemPrompt ? { system_prompt: systemPrompt } : {}),
    ...(temperature !== undefined ? { temperature } : {}),
    ...(maxTokens !== undefined ? { max_tokens: maxTokens } : {}),
  });

  const output = result.outputs?.[0];
  if (typeof output !== "string" || !output) {
    throw new Error("WaveSpeed returned no text output");
  }

  if (/^https?:\/\//i.test(output.trim())) {
    const response = await fetch(output.trim());
    if (!response.ok) {
      throw new Error(`Failed to fetch LLM output (${response.status})`);
    }
    return await response.text();
  }

  return output;
}
