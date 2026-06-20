import type {
  CustomizationCategory,
  CustomizationData,
} from "./types/CustomizationData";

/** Display metadata for a category, kept UI-framework agnostic. */
export type CategoryMeta = {
  category: CustomizationCategory;
  label: string;
  tagline: string;
};

/**
 * Hand-tuned labels/taglines for the categories the model commonly returns.
 * Anything outside this map still works — it falls back to a slug-derived label
 * and a generic tagline — so genuinely novel categories are fully supported.
 */
const CURATED_META: Record<string, { label: string; tagline: string }> = {
  wheels: { label: "Wheels", tagline: "Choose your perfect stance" },
  paint: { label: "Paint & Wraps", tagline: "Set the tone of your build" },
  suspension: { label: "Suspension", tagline: "Dial in the ride height" },
  "ride-height": { label: "Ride Height", tagline: "Dial in the stance" },
  "body-kits": { label: "Body Kits", tagline: "Reshape the silhouette" },
  lighting: { label: "Lighting", tagline: "Define the signature glow" },
  spoilers: {
    label: "Spoilers & Wings",
    tagline: "Add downforce with attitude",
  },
};

const DEFAULT_TAGLINE = "Tailor it to your build";

/** Capitalized words that should keep a specific casing in derived labels. */
const LABEL_WORD_OVERRIDES: Record<string, string> = {
  jdm: "JDM",
  oem: "OEM",
  led: "LED",
  hid: "HID",
  gt: "GT",
};

/** Turns a category slug into a human label, e.g. "body-kits" -> "Body Kits". */
export function categoryLabel(category: CustomizationCategory): string {
  return category
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map(
      (word) =>
        LABEL_WORD_OVERRIDES[word] ??
        word.charAt(0).toUpperCase() + word.slice(1),
    )
    .join(" ");
}

/** Display metadata for a category, curated when known, derived otherwise. */
export function getCategoryMeta(category: CustomizationCategory): CategoryMeta {
  const curated = CURATED_META[category];
  return {
    category,
    label: curated?.label ?? categoryLabel(category),
    tagline: curated?.tagline ?? DEFAULT_TAGLINE,
  };
}

/**
 * Categories the user can actually customize, in the order the LLM returned
 * them. Driven by the data, so plan-gated builds (e.g. the free plan's 3
 * categories) only surface the categories the backend generated options for.
 */
export function getActiveCategories(
  data: CustomizationData,
): CustomizationCategory[] {
  return Object.keys(data.categories).filter(
    (category) => data.categories[category].items.length > 0,
  );
}
