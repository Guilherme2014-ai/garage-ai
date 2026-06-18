import type {
  CustomizationOption,
  CustomizationOptionsResult,
  GenerateCustomizationOptionsInput,
} from "./types";

/** Number of mock options generated per category (within the 8-15 range). */
const MOCK_OPTIONS_PER_CATEGORY = 10;

/** Cycled palette so paint-like categories get plausible color swatches. */
const MOCK_COLORS = [
  "#5b21b6",
  "#dc2626",
  "#0d9488",
  "#6b7280",
  "#ea580c",
  "#2563eb",
  "#b45309",
  "#18181b",
  "#cbd5e1",
  "#16a34a",
];

const MOCK_BRANDS = [
  "Volk Racing",
  "BBS",
  "HKS",
  "Brembo",
  "Recaro",
  "Bilstein",
  "APR",
  "Mishimoto",
  "Tein",
  "Rotiform",
];

function titleCase(value: string): string {
  return value
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

function buildOption(category: string, index: number): CustomizationOption {
  const rank = index + 1;
  const label = titleCase(category);
  const brand = MOCK_BRANDS[index % MOCK_BRANDS.length];

  return {
    rank,
    name: `${label} Mock ${rank}`,
    brand,
    description: `Mock ${label.toLowerCase()} option ${rank} for preview/testing.`,
    visualDescription: `mock ${label.toLowerCase()} variant ${rank} applied to the car`,
    price: rank === 1 ? 0 : rank * 250,
    colorHex: MOCK_COLORS[index % MOCK_COLORS.length],
    tags: ["mock", label.toLowerCase()],
  };
}

/**
 * Returns static, deterministic customization options without calling the LLM.
 * Used when `MOCK_AI_CALLS` is enabled to avoid spending API credits.
 */
export function generateMockOptions(
  input: GenerateCustomizationOptionsInput,
): CustomizationOptionsResult {
  const categories: Record<string, CustomizationOption[]> = {};

  for (const category of input.categories) {
    categories[category] = Array.from(
      { length: MOCK_OPTIONS_PER_CATEGORY },
      (_, index) => buildOption(category, index),
    );
  }

  return {
    car: input.car,
    vehicleProfile: {
      style: "Mock",
      era: "Mock era",
      summary: `Mock profile for ${input.car} (MOCK_AI_CALLS enabled).`,
    },
    categories,
  };
}
