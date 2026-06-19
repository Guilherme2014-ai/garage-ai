import { isMockAiEnabled } from "@/server/config/ai-mock";
import { ValidationError } from "@/server/domain/errors";
import {
  DEFAULT_PLAN_MODE,
  getPlanLimits,
  isPlanMode,
} from "@/server/domain/plan/plan-mode";
import { generateText } from "@/server/infrastructure/wavespeed/wavespeed-llm";
import { generateMockOptions } from "./mockOptions";
import { buildSystemPrompt, buildUserPrompt } from "./promptBuilder";
import type {
  CustomizationOption,
  CustomizationOptionsResult,
  GenerateCustomizationOptionsInput,
  VehicleProfile,
} from "./types";

const LLM_MODEL = "openai/gpt-5-chat";
const LLM_MAX_TOKENS = 8000;
const LLM_TEMPERATURE = 0.7;

function normalizeInput(
  input: GenerateCustomizationOptionsInput,
): GenerateCustomizationOptionsInput {
  const car = input.car?.trim();
  if (!car) {
    throw new ValidationError("A car name/model is required");
  }

  if (!Array.isArray(input.categories)) {
    throw new ValidationError("Categories must be an array");
  }

  const planMode = isPlanMode(input.planMode)
    ? input.planMode
    : DEFAULT_PLAN_MODE;
  const limits = getPlanLimits(planMode);

  const categories = Array.from(
    new Set(
      input.categories
        .filter((c): c is string => typeof c === "string")
        .map((c) => c.trim().toLowerCase())
        .filter(Boolean),
    ),
  ).slice(0, limits.maxCategories);

  if (categories.length === 0) {
    throw new ValidationError("At least one category is required");
  }

  return { car, categories, planMode };
}

/**
 * Strips markdown fences / surrounding prose and parses the first JSON object
 * found in the model output.
 */
function extractJson(raw: string): unknown {
  const withoutFences = raw
    .replace(/```(?:json)?/gi, "")
    .replace(/```/g, "")
    .trim();

  const start = withoutFences.indexOf("{");
  const end = withoutFences.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("LLM response did not contain a JSON object");
  }

  try {
    return JSON.parse(withoutFences.slice(start, end + 1));
  } catch {
    throw new Error("Failed to parse LLM response as JSON");
  }
}

function coerceOption(
  value: unknown,
  fallbackRank: number,
): CustomizationOption {
  const obj = (value ?? {}) as Record<string, unknown>;
  const rank =
    typeof obj.rank === "number" && Number.isFinite(obj.rank)
      ? obj.rank
      : fallbackRank;

  const price =
    typeof obj.price === "number" && Number.isFinite(obj.price) && obj.price > 0
      ? Math.round(obj.price)
      : 0;

  const colorHex =
    typeof obj.colorHex === "string" && /^#[0-9a-fA-F]{6}$/.test(obj.colorHex)
      ? obj.colorHex
      : undefined;

  return {
    rank,
    name: typeof obj.name === "string" ? obj.name : "",
    brand: typeof obj.brand === "string" ? obj.brand : "",
    description: typeof obj.description === "string" ? obj.description : "",
    visualDescription:
      typeof obj.visualDescription === "string" ? obj.visualDescription : "",
    price,
    ...(colorHex ? { colorHex } : {}),
    tags: Array.isArray(obj.tags)
      ? obj.tags.filter((t): t is string => typeof t === "string")
      : [],
  };
}

function coerceVehicleProfile(value: unknown): VehicleProfile {
  const obj = (value ?? {}) as Record<string, unknown>;
  return {
    style: typeof obj.style === "string" ? obj.style : "",
    era: typeof obj.era === "string" ? obj.era : "",
    summary: typeof obj.summary === "string" ? obj.summary : "",
  };
}

function buildResult(
  parsed: unknown,
  input: GenerateCustomizationOptionsInput,
): CustomizationOptionsResult {
  const root = (parsed ?? {}) as Record<string, unknown>;
  const rawCategories = (root.categories ?? {}) as Record<string, unknown>;
  const optionsPerCategory = getPlanLimits(input.planMode).optionsPerCategory;

  const categories: Record<string, CustomizationOption[]> = {};

  for (const category of input.categories) {
    const list = rawCategories[category];
    if (!Array.isArray(list) || list.length === 0) {
      throw new Error(
        `LLM response missing options for category "${category}"`,
      );
    }

    const options = list
      .map((item, index) => coerceOption(item, index + 1))
      .filter((option) => option.name && option.brand)
      .sort((a, b) => a.rank - b.rank);

    if (options.length < optionsPerCategory) {
      throw new Error(
        `LLM generated fewer than ${optionsPerCategory} valid options for "${category}"`,
      );
    }

    // Keep the top `optionsPerCategory` options, then normalize ranks to order.
    categories[category] = options
      .slice(0, optionsPerCategory)
      .map((option, index) => ({ ...option, rank: index + 1 }));
  }

  return {
    car: typeof root.car === "string" && root.car.trim() ? root.car : input.car,
    vehicleProfile: coerceVehicleProfile(root.vehicleProfile),
    categories,
    planMode: input.planMode,
  };
}

export const customizationOptionsService = {
  /**
   * Generates vehicle-aware, ranked customization options per category using
   * the WaveSpeed LLM. Validates input, builds the prompt, calls the model, and
   * parses/validates the JSON response into a typed structure.
   */
  async generateOptions(
    rawInput: GenerateCustomizationOptionsInput,
  ): Promise<CustomizationOptionsResult> {
    const input = normalizeInput(rawInput);

    if (isMockAiEnabled()) {
      return generateMockOptions(input);
    }

    const completion = await generateText({
      prompt: buildUserPrompt(input),
      systemPrompt: buildSystemPrompt(),
      model: LLM_MODEL,
      temperature: LLM_TEMPERATURE,
      maxTokens: LLM_MAX_TOKENS,
      priority: "throughput",
      reasoning: false,
    });

    const parsed = extractJson(completion);
    return buildResult(parsed, input);
  },
};
