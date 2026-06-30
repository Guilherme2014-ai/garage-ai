/**
 * Client-safe re-export of the canonical credits module. The feature layer never
 * reaches into `@/server`; these are plain constants/types with no server-only
 * imports, so they are safe in the browser bundle (mirrors
 * `src/features/customize/core/plan/planMode.ts`).
 */
export {
  bumpReferencePriceUsd,
  bumpSavingsPercent,
  CREDIT_BUMP,
  CREDIT_PACKS,
  CREDITS_PER_CATEGORY,
  type CreditBump,
  type CreditPack,
  type CreditPackId,
  creditsToModifications,
  getCreditPack,
  isCreditPackId,
  packReferencePriceUsd,
  packSavingsPercent,
  pricePerCredit,
  STARTING_CREDITS,
} from "@/lib/credits/credits";
