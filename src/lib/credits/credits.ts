/**
 * Single source of truth for the credits economy, shared by server and client.
 * Kept in `lib` (framework-agnostic, no server-only imports) so both layers
 * reference the same definition instead of drifting copies — mirrors
 * `src/lib/plan/plan-mode.ts`.
 */

/** Credits granted to brand-new users (= 3 free category modifications). */
export const STARTING_CREDITS = 15;

/** Credits charged the first time a category's previews are generated. */
export const CREDITS_PER_CATEGORY = 5;

/** Identifier for a purchasable credit pack. */
export type CreditPackId = "p60" | "p120" | "p240";

export interface CreditPack {
  id: CreditPackId;
  /** Credits added to the buyer's balance. */
  credits: number;
  /** Price in whole US dollars (display fallback). */
  priceUsd: number;
  /** Short label for the UI. */
  label: string;
  /** Overrides the `$priceUsd` display (e.g. for non-USD packs). */
  priceLabel?: string;
}

/** The packs offered at checkout, cheapest first. */
export const CREDIT_PACKS: CreditPack[] = [
  { id: "p60", credits: 60, priceUsd: 5, label: "60 credits" },
  { id: "p120", credits: 120, priceUsd: 10, label: "120 credits" },
  { id: "p240", credits: 240, priceUsd: 20, label: "240 credits" },
];

/** Resolves a pack by id, or `undefined` for unknown values. */
export function getCreditPack(id: string): CreditPack | undefined {
  return CREDIT_PACKS.find((pack) => pack.id === id);
}

/** Type guard for coercing arbitrary (e.g. request) strings into a pack id. */
export function isCreditPackId(value: unknown): value is CreditPackId {
  return CREDIT_PACKS.some((pack) => pack.id === value);
}
