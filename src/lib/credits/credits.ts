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

/**
 * Internal "list" value of one category (= {@link CREDITS_PER_CATEGORY} credits =
 * 5 previews). This is the reference rate every pack is discounted against — it
 * anchors the struck-through regular price and the "Save X%" badges. Credits are
 * the unit we sell and display; categories are an internal accounting concept.
 */
export const CATEGORY_VALUE_USD = 0.89;

/** Identifier for a purchasable credit pack. */
export type CreditPackId = "p30" | "p60" | "p120" | "p300";

export interface CreditPack {
  id: CreditPackId;
  /** Credits added to the buyer's balance. */
  credits: number;
  /** Price in US dollars (may include cents) — matches the Stripe price. */
  priceUsd: number;
  /** Short label for the UI. */
  label: string;
  /** Overrides the `$priceUsd` display (e.g. for non-USD packs). */
  priceLabel?: string;
  /** Marketing badge, e.g. "Most Popular" / "Best Value". */
  badge?: string;
  /** The recommended pack — visually emphasized in the UI. */
  highlight?: boolean;
}

/**
 * The packs offered at checkout, cheapest first. Every pack is priced below the
 * per-credit {@link CATEGORY_VALUE_USD} rate, and larger packs discount it more —
 * which powers the "Save X%" framing and nudges buyers toward higher-value
 * tiers. The dollar prices match the configured Stripe prices exactly.
 */
export const CREDIT_PACKS: CreditPack[] = [
  { id: "p30", credits: 30, priceUsd: 4.99, label: "Starter" },
  {
    id: "p60",
    credits: 60,
    priceUsd: 8.99,
    label: "Builder",
    badge: "Most Popular",
    highlight: true,
  },
  { id: "p120", credits: 120, priceUsd: 16.99, label: "Pro" },
  {
    id: "p300",
    credits: 300,
    priceUsd: 39.99,
    label: "Garage",
    badge: "Best Value",
  },
];

/** Resolves a pack by id, or `undefined` for unknown values. */
export function getCreditPack(id: string): CreditPack | undefined {
  return CREDIT_PACKS.find((pack) => pack.id === id);
}

/** Type guard for coercing arbitrary (e.g. request) strings into a pack id. */
export function isCreditPackId(value: unknown): value is CreditPackId {
  return CREDIT_PACKS.some((pack) => pack.id === value);
}

/**
 * One-time order bump offered during checkout: a chunk of bonus credits at a
 * steep, exclusive discount (the best per-credit rate anywhere in the funnel).
 * Designed as an easy "yes" that lifts average order value without changing the
 * base pack the buyer already chose. Its discount is derived from the same
 * per-credit reference rate as the packs, so there are no hardcoded percentages.
 */
export interface CreditBump {
  /** Stable id, stamped into checkout metadata for analytics. */
  id: string;
  /** Bonus credits added on top of the chosen pack. */
  credits: number;
  /** Discounted add-on price in US dollars (may include cents). */
  priceUsd: number;
  /** Short headline for the bump card. */
  label: string;
  /** Supporting copy explaining the offer. */
  description: string;
}

export const CREDIT_BUMP: CreditBump = {
  id: "bonus-50",
  credits: 50,
  priceUsd: 4.99,
  label: "Add 50 bonus credits",
  description:
    "One-time offer — only available with this purchase. Lock in bonus credits at their steepest discount.",
};

/** Formats a USD amount for display, always with two decimals (e.g. "8.99"). */
export function formatUsd(amount: number): string {
  return amount.toFixed(2);
}

/** How many category modifications a credit balance unlocks. */
export function creditsToModifications(credits: number): number {
  return Math.floor(credits / CREDITS_PER_CATEGORY);
}

/** Per-credit USD price for a pack (lower is better value). */
export function pricePerCredit(pack: CreditPack): number {
  return pack.priceUsd / pack.credits;
}

/** Rounds a dollar amount to whole cents so displayed prices always tally. */
function roundToCents(amount: number): number {
  return Math.round(amount * 100) / 100;
}

/**
 * The per-credit reference rate every discount compares against: one category's
 * {@link CATEGORY_VALUE_USD} spread across its {@link CREDITS_PER_CATEGORY}
 * credits.
 */
const BASE_UNIT_PRICE = CATEGORY_VALUE_USD / CREDITS_PER_CATEGORY;

/**
 * The "regular" price these credits would cost at the per-credit reference rate,
 * rounded to whole cents. Shown struck-through next to the real price so the
 * saving is concrete.
 */
export function packReferencePriceUsd(pack: CreditPack): number {
  return roundToCents(pack.credits * BASE_UNIT_PRICE);
}

/**
 * Whole-percent savings versus the reference rate, derived from the same rounded
 * reference price shown in the UI so the badge and strike-through always agree.
 * Returns 0 when the pack isn't actually cheaper than the reference.
 */
export function packSavingsPercent(pack: CreditPack): number {
  const reference = packReferencePriceUsd(pack);
  if (reference <= pack.priceUsd) {
    return 0;
  }
  return Math.round(((reference - pack.priceUsd) / reference) * 100);
}

/** "Regular" price of the bump's credits at the reference rate, to whole cents. */
export function bumpReferencePriceUsd(bump: CreditBump = CREDIT_BUMP): number {
  return roundToCents(bump.credits * BASE_UNIT_PRICE);
}

/** Whole-percent savings on the order bump versus the reference rate. */
export function bumpSavingsPercent(bump: CreditBump = CREDIT_BUMP): number {
  const reference = bumpReferencePriceUsd(bump);
  if (reference <= bump.priceUsd) {
    return 0;
  }
  return Math.round(((reference - bump.priceUsd) / reference) * 100);
}
