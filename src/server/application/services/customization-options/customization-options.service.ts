import { isMockAiEnabled } from "@/server/config/ai-mock";
import { ValidationError } from "@/server/domain/errors";
import {
  DEFAULT_PLAN_MODE,
  getPlanLimits,
  isPlanMode,
  type PlanMode,
} from "@/server/domain/plan/plan-mode";
import { generateText } from "@/server/infrastructure/llm";
import { getCategoriesForPlan } from "./categories";
import { generateMockOptions } from "./mockOptions";
import { buildSystemPrompt, buildUserPrompt } from "./promptBuilder";
import type {
  CustomizationOption,
  CustomizationOptionsResult,
  GenerateCustomizationOptionsInput,
  VehicleProfile,
} from "./types";

/**
 * Optional model override. When unset, the active provider (see
 * `infrastructure/llm`) applies its own default model, so the right id is used
 * for whichever of WaveSpeed / OpenRouter is selected via `LLM_PROVIDER`.
 */
const LLM_MODEL = process.env.LLM_MODEL?.trim() || undefined;
const LLM_MAX_TOKENS = 8000;
const LLM_TEMPERATURE = 0.7;

interface NormalizedInput {
  car: string;
  planMode: PlanMode;
  /** Client-supplied categories — only used in mock mode; may be empty. */
  requestedCategories: string[];
}

function normalizeInput(
  input: GenerateCustomizationOptionsInput,
): NormalizedInput {
  const car = input.car?.trim();
  if (!car) {
    throw new ValidationError("A car name/model is required");
  }

  if (input.categories !== undefined && !Array.isArray(input.categories)) {
    throw new ValidationError("Categories must be an array");
  }

  const planMode = isPlanMode(input.planMode)
    ? input.planMode
    : DEFAULT_PLAN_MODE;
  const limits = getPlanLimits(planMode);

  const requestedCategories = Array.from(
    new Set(
      (input.categories ?? [])
        .filter((c): c is string => typeof c === "string")
        .map((c) => c.trim().toLowerCase())
        .filter(Boolean),
    ),
  ).slice(0, limits.categoriesCount);

  return { car, planMode, requestedCategories };
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

interface ResultContext {
  car: string;
  planMode: PlanMode;
}

/** Normalizes an LLM-chosen category name into a clean lowercase slug. */
function slugifyCategory(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * The LLM both chooses the categories and fills their options, so the response
 * keys are dynamic. We take the categories it returned (in order), keep the ones
 * that meet the plan's per-category option bar, and cap them at `maxCategories`.
 */
function buildResult(
  parsed: unknown,
  context: ResultContext,
): CustomizationOptionsResult {
  const root = (parsed ?? {}) as Record<string, unknown>;
  const rawCategories = (root.categories ?? {}) as Record<string, unknown>;
  const { categoriesCount: maxCategories, optionsPerCategory } = getPlanLimits(
    context.planMode,
  );

  const categories: Record<string, CustomizationOption[]> = {};

  for (const [rawKey, list] of Object.entries(rawCategories)) {
    if (Object.keys(categories).length >= maxCategories) break;

    const slug = slugifyCategory(rawKey);
    if (!slug || categories[slug] || !Array.isArray(list)) {
      continue;
    }

    const options = list
      .map((item, index) => coerceOption(item, index + 1))
      .filter((option) => option.name && option.brand)
      .sort((a, b) => a.rank - b.rank);

    if (options.length < optionsPerCategory) {
      continue;
    }

    // Keep the top `optionsPerCategory` options, then normalize ranks to order.
    categories[slug] = options
      .slice(0, optionsPerCategory)
      .map((option, index) => ({ ...option, rank: index + 1 }));
  }

  if (Object.keys(categories).length === 0) {
    throw new Error("LLM response contained no valid categories");
  }

  return {
    car:
      typeof root.car === "string" && root.car.trim() ? root.car : context.car,
    vehicleProfile: coerceVehicleProfile(root.vehicleProfile),
    categories,
    planMode: context.planMode,
  };
}

export const customizationOptionsService = {
  /**
   * Generates vehicle-aware, ranked customization options using the configured
   * LLM. The model chooses both the categories and their options (capped by the
   * plan's `maxCategories` / `optionsPerCategory` limits); the backend does not
   * dictate the category set. The client-supplied categories only seed mock mode.
   * Builds the prompt, calls the model, and parses/validates the JSON response.
   */
  async generateOptions(
    rawInput: GenerateCustomizationOptionsInput,
  ): Promise<CustomizationOptionsResult> {
    const { car, planMode, requestedCategories } = normalizeInput(rawInput);

    if (isMockAiEnabled()) {
      // Mock mode honors the client's categories (their only purpose); when none
      // were sent it falls back to the canonical mock catalog.
      const categories = requestedCategories.length
        ? requestedCategories
        : getCategoriesForPlan(planMode).map((c) => c.slug);
      return generateMockOptions({ car, categories, planMode });
    }

    const completion = await generateText({
      prompt: buildUserPrompt({ car, planMode }),
      systemPrompt: buildSystemPrompt(),
      model: LLM_MODEL,
      temperature: LLM_TEMPERATURE,
      maxTokens: LLM_MAX_TOKENS,
      priority: "latency",
      reasoning: false,
    });

    const parsed = extractJson(completion);
    return buildResult(parsed, { car, planMode });
  },
};
