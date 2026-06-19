/**
 * Client-safe re-export of the canonical credits module. The feature layer never
 * reaches into `@/server`; these are plain constants/types with no server-only
 * imports, so they are safe in the browser bundle (mirrors
 * `src/features/customize/core/plan/planMode.ts`).
 */
export {
  CREDIT_PACKS,
  CREDITS_PER_CATEGORY,
  type CreditPack,
  type CreditPackId,
  getCreditPack,
  isCreditPackId,
  STARTING_CREDITS,
} from "@/lib/credits/credits";
