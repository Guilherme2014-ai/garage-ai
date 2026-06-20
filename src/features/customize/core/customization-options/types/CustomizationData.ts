/**
 * A customization category, identified by its slug. The set of categories is
 * generated per-vehicle by the LLM (not a fixed list), so this is an open string
 * type rather than an enum. Display metadata is derived in `catalog.ts`.
 */
export type CustomizationCategory = string;

/**
 * Lifecycle of any AI-generated artifact (a category catalog or a vehicle
 * preview). Content is generated lazily and reused once available.
 */
export type GenerationStatus = "not-generated" | "generating" | "generated";

/**
 * The generated preview for a single option, showing the option applied on top
 * of the category's base image. Generated in parallel when a category is
 * entered.
 */
export type ItemPreview = {
  status: GenerationStatus;
  imageUrl: string | null;
};

/** A single selectable customization option within a category. */
export type CustomizationCategoryItem = {
  slug: string;
  name: string;
  description: string;
  price: number;
  /** Representative color used to render mock previews/swatches. */
  swatch: string;
  /**
   * Visual description of the installed part. Sent to the car image
   * modification route to build the edit prompt for this option.
   */
  visualDescription?: string;
  /** Reserved for the real AI-generated option asset. */
  banner?: string;
  /** The car image with this option applied (per-option preview). */
  preview?: ItemPreview;
};

/** Available options for a category plus their generation status. */
export type CustomizationCategoryContent = {
  status: GenerationStatus;
  items: CustomizationCategoryItem[];
};

/** A category-to-selected-option-slug map describing a single combination. */
export type CombinationSelections = Partial<
  Record<CustomizationCategory, string>
>;

/**
 * The generated vehicle preview for the current combination. The latest
 * modification is conceptually applied on top of every previous one.
 */
export type GeneratedPreview = {
  status: GenerationStatus;
  combinationString: string;
  /** Reserved for the real AI-generated image. */
  imageUrl: string | null;
  renderedAt: number | null;
};

/**
 * Complete state of a single customization combination: the user's selections,
 * the available options per category, and the generated preview.
 */
export type CustomizationData = {
  selections: CombinationSelections;
  categories: Record<CustomizationCategory, CustomizationCategoryContent>;
  preview: GeneratedPreview;
};
