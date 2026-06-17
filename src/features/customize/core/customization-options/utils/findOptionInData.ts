import type {
  CustomizationCategory,
  CustomizationCategoryItem,
  CustomizationData,
} from "../types/CustomizationData";

/**
 * Looks up a selected option within the live {@link CustomizationData} (the
 * LLM-generated items for the current session), rather than the static catalog.
 */
export function findOptionInData(
  data: CustomizationData,
  category: CustomizationCategory,
  slug: string | undefined,
): CustomizationCategoryItem | undefined {
  if (!slug) {
    return undefined;
  }
  return data.categories[category]?.items.find((item) => item.slug === slug);
}
