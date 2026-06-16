import { OPTION_CATALOG } from "../catalog";
import type {
  CombinationSelections,
  CustomizationCategory,
  CustomizationCategoryContent,
  GeneratedPreview,
} from "../types/CustomizationData";
import { buildCombinationString } from "../utils/buildCombinationString";

/**
 * Simulated latency of the AI pipeline. Category catalogs resolve faster than
 * full vehicle previews, which are the expensive operation.
 */
const CATEGORY_GENERATION_MS = 650;
const PREVIEW_GENERATION_MS = 1100;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * MOCK: generates the available options for a category.
 *
 * TODO: replace with the real AI generation call. The current implementation
 * returns the static catalog after a simulated delay.
 */
export async function generateCategoryContent(
  category: CustomizationCategory,
  _selections: CombinationSelections,
): Promise<CustomizationCategoryContent> {
  await delay(CATEGORY_GENERATION_MS);

  return {
    status: "generated",
    items: OPTION_CATALOG[category],
  };
}

/**
 * MOCK: generates the vehicle preview for a combination, conceptually applying
 * the latest modification on top of all previous ones.
 *
 * TODO: replace with the real AI image-edit call. The current implementation
 * only produces preview metadata after a simulated delay.
 */
export async function generateCombinationPreview(
  selections: CombinationSelections,
): Promise<GeneratedPreview> {
  await delay(PREVIEW_GENERATION_MS);

  return {
    status: "generated",
    combinationString: buildCombinationString(selections),
    imageUrl: null,
    renderedAt: Date.now(),
  };
}
