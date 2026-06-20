import { getPlanLimits, type PlanMode } from "@/server/domain/plan/plan-mode";

/** A backend-owned customization category and the LLM guidance for it. */
export interface CategoryDefinition {
  /** API/UI slug. Becomes a key of the response `categories` object. */
  slug: string;
  /** Short hint telling the model what visible modification this category covers. */
  hint: string;
}

/**
 * Default customization categories for MOCK/testing mode only.
 *
 * Real generation lets the LLM choose categories per-vehicle (see
 * `promptBuilder.ts` / `buildResult`), so this list is not used for live calls.
 * It backs `MOCK_AI_CALLS` runs (and the no-categories fallback). The slugs match
 * the labels/icons curated on the client (`catalog.ts` / `icons.tsx`) so mocked
 * responses render nicely, but the client renders any category slug.
 */
export const CUSTOMIZATION_CATEGORIES: CategoryDefinition[] = [
  {
    slug: "wheels",
    hint: "aftermarket wheels/rims: spoke design, finish, size, fitment",
  },
  {
    slug: "paint",
    hint: "paint colors, vinyl wraps, and finishes (gloss, matte, satin)",
  },
  {
    slug: "suspension",
    hint: "stance / ride-height look only — stock, mild drop, aggressive slam, or lifted",
  },
  {
    slug: "body-kits",
    hint: "bumpers, side skirts, fenders, diffusers, and full body kits",
  },
  {
    slug: "lighting",
    hint: "headlights, taillights, and exterior accent lighting",
  },
  {
    slug: "spoilers",
    hint: "rear spoilers and wings",
  },
];

/**
 * Returns the mock categories for a plan, capped by the plan's `maxCategories`
 * limit (e.g. free plans get the first three). Mock/fallback use only.
 */
export function getCategoriesForPlan(planMode: PlanMode): CategoryDefinition[] {
  const { categoriesCount: maxCategories } = getPlanLimits(planMode);
  return CUSTOMIZATION_CATEGORIES.slice(0, maxCategories);
}
