import { OpenRouter } from "@openrouter/sdk";
import type { ChatMessages } from "@openrouter/sdk/models";
import type { GenerateTextOptions } from "../llm/types";

const DEFAULT_LLM = "openai/gpt-4o-mini";

/**
 * Generates text via OpenRouter's chat-completions endpoint and returns the raw
 * completion string.
 *
 * Mirrors the contract of the WaveSpeed provider (`wavespeed/wavespeed-llm`) so
 * the two are interchangeable behind `llm/index.ts`. The API key is read from
 * `OPENROUTER_API_KEY`.
 */
export async function generateText({
  prompt,
  systemPrompt,
  model = DEFAULT_LLM,
  temperature,
  maxTokens,
  reasoning = false,
}: GenerateTextOptions): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not set");
  }

  const client = new OpenRouter({ apiKey });

  const messages: ChatMessages[] = [
    ...(systemPrompt
      ? [{ role: "system" as const, content: systemPrompt }]
      : []),
    { role: "user" as const, content: prompt },
  ];

  const result = await client.chat.send({
    chatRequest: {
      model,
      messages,
      stream: false,
      ...(temperature !== undefined ? { temperature } : {}),
      ...(maxTokens !== undefined ? { maxTokens } : {}),
      // The shared option is a boolean; map it to a sensible default effort.
      ...(reasoning ? { reasoning: { effort: "medium" as const } } : {}),
    },
  });

  const output = extractText(result.choices?.[0]?.message?.content);
  if (!output) {
    throw new Error("OpenRouter returned no text output");
  }

  return output;
}

/**
 * Message content may come back as a plain string or as an array of typed
 * parts; concatenate the text parts so callers always get a string.
 */
function extractText(content: unknown): string {
  if (typeof content === "string") {
    return content;
  }

  if (Array.isArray(content)) {
    return content
      .map((part) =>
        part && typeof part === "object" && "text" in part
          ? String((part as { text: unknown }).text ?? "")
          : "",
      )
      .join("");
  }

  return "";
}
