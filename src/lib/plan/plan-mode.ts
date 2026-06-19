/**
 * Single source of truth for plan modes, shared by server and client. Kept in
 * `lib` (framework-agnostic, no server-only imports) so both layers reference
 * the same definition instead of drifting copies.
 */
export type PlanMode = "free" | "top-up";

/** Plan applied to brand-new users and used as a fallback for unknown values. */
export const DEFAULT_PLAN_MODE: PlanMode = "free";

/** Privileges granted by each plan mode. */
export interface PlanLimits {
  /** Maximum number of customization categories generated. */
  maxCategories: number;
  /** Number of options generated per category. */
  optionsPerCategory: number;
  /** Whether the user may download the generated build image. */
  canDownload: boolean;
}

export const PLAN_LIMITS: Record<PlanMode, PlanLimits> = {
  free: {
    maxCategories: 3,
    optionsPerCategory: 5,
    canDownload: false,
  },
  "top-up": {
    maxCategories: Number.POSITIVE_INFINITY,
    optionsPerCategory: 12,
    canDownload: true,
  },
};

/** Type guard for coercing arbitrary (e.g. database) strings into a PlanMode. */
export function isPlanMode(value: unknown): value is PlanMode {
  return value === "free" || value === "top-up";
}

/** Resolves the limits for a plan, falling back to the default plan's limits. */
export function getPlanLimits(plan: PlanMode): PlanLimits {
  return PLAN_LIMITS[plan] ?? PLAN_LIMITS[DEFAULT_PLAN_MODE];
}
