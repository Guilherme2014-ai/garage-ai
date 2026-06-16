export enum CustomizationCategory {
  WHEELS = "wheels",
  PAINT = "paint",
  SUSPENSION = "suspension",
  BODY_KITS = "body-kits",
  LIGHTING = "lighting",
  SPOILERS = "spoilers",
}

/**
 * Lifecycle of any AI-generated artifact (a category catalog or a vehicle
 * preview). Content is generated lazily and reused once available.
 */
export type GenerationStatus = "not-generated" | "generating" | "generated";

/** A single selectable customization option within a category. */
export type CustomizationCategoryItem = {
  slug: string;
  name: string;
  description: string;
  price: number;
  /** Representative color used to render mock previews/swatches. */
  swatch: string;
  /** Reserved for the real AI-generated option asset. */
  banner?: string;
};

/** Available options for a category plus their generation status. */
export type CustomizationCategoryContent = {
  status: GenerationStatus;
  items: CustomizationCategoryItem[];
};

/** A category-to-selected-option-slug map describing a single combination. */
export type CombinationSelections = Partial<Record<CustomizationCategory, string>>;

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
