import type { ApiCustomizationOptionsResult } from "../../../api/customizeApi";
import type {
  CustomizationCategoryContent,
  CustomizationCategoryItem,
  CustomizationData,
} from "../types/CustomizationData";

/** Deterministic, pleasant-ish color derived from an option name. */
function colorFromString(value: string): string {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = value.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 55%, 45%)`;
}

function slugify(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "option"
  );
}

function toItem(
  option: ApiCustomizationOptionsResult["categories"][string][number],
  index: number,
  usedSlugs: Set<string>,
): CustomizationCategoryItem {
  let slug = slugify(option.name);
  if (usedSlugs.has(slug)) {
    slug = `${slug}-${index}`;
  }
  usedSlugs.add(slug);

  const description = option.brand
    ? `${option.brand} · ${option.description}`
    : option.description;

  return {
    slug,
    name: option.name,
    description,
    price: option.price ?? 0,
    swatch: option.colorHex ?? colorFromString(option.name),
    visualDescription: option.visualDescription,
  };
}

/**
 * Maps the LLM `/api/customize/options` response into the {@link CustomizationData}
 * the UI consumes. The categories are whatever the model generated for this
 * vehicle (keys preserved in response order); all are marked `generated` up-front
 * (a single LLM call produced them), and the preview starts at the user's photo.
 */
export function buildInitialDataFromOptions(
  result: ApiCustomizationOptionsResult,
  baseImageUrl: string,
): CustomizationData {
  const categories: Record<string, CustomizationCategoryContent> = {};

  for (const [category, rawOptions] of Object.entries(result.categories)) {
    const usedSlugs = new Set<string>();
    const items = (rawOptions ?? []).map((option, index) =>
      toItem(option, index, usedSlugs),
    );

    categories[category] = {
      status: "generated",
      items,
    };
  }

  return {
    selections: {},
    categories,
    preview: {
      status: "generated",
      combinationString: "",
      imageUrl: baseImageUrl,
      renderedAt: Date.now(),
    },
  };
}
