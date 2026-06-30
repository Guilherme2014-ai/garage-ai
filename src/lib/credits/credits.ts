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
  /** Price in whole US dollars — matches the configured Stripe price. */
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
 * The packs offered at checkout, cheapest first. Larger packs include bonus
 * credits (a better per-credit rate), which powers the "Save X%" framing and
 * nudges buyers toward higher-value tiers. The dollar prices match the
 * configured Stripe prices; only the granted credits scale with the tier.
 */
export const CREDIT_PACKS: CreditPack[] = [
  { id: "p60", credits: 60, priceUsd: 5, label: "Starter" },
  {
    id: "p120",
    credits: 150,
    priceUsd: 10,
    label: "Pro",
    badge: "Most Popular",
    highlight: true,
  },
  {
    id: "p240",
    credits: 360,
    priceUsd: 20,
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
 * steep, exclusive discount. Designed as an easy "yes" that lifts average order
 * value without changing the base pack the buyer already chose.
 */
export interface CreditBump {
  /** Stable id, stamped into checkout metadata for analytics. */
  id: string;
  /** Bonus credits added on top of the chosen pack. */
  credits: number;
  /** Discounted add-on price in whole US dollars. */
  priceUsd: number;
  /** Short headline for the bump card. */
  label: string;
  /** Supporting copy explaining the offer. */
  description: string;
}

export const CREDIT_BUMP: CreditBump = {
  id: "bonus-120",
  credits: 120,
  priceUsd: 6,
  label: "Add 120 bonus credits",
  description:
    "One-time offer: lock in 120 extra credits at nearly half off. Only available with this purchase.",
};

/** How many category modifications a credit balance unlocks. */
export function creditsToModifications(credits: number): number {
  return Math.floor(credits / CREDITS_PER_CATEGORY);
}

/** Per-credit USD price for a pack (lower is better value). */
export function pricePerCredit(pack: CreditPack): number {
  return pack.priceUsd / pack.credits;
}

/** The entry pack's unit price — the reference rate all savings compare to. */
const BASE_UNIT_PRICE = pricePerCredit(CREDIT_PACKS[0]);

/**
 * The "regular" price these credits would cost at the entry-pack rate, rounded
 * to whole dollars. Shown struck-through next to the real price so the saving is
 * concrete.
 */
export function packReferencePriceUsd(pack: CreditPack): number {
  return Math.round(pack.credits * BASE_UNIT_PRICE);
}

/**
 * Whole-percent savings versus the entry-pack rate, derived from the same
 * rounded reference price shown in the UI so the badge and strike-through always
 * agree. Returns 0 for the entry pack (no discount to advertise).
 */
export function packSavingsPercent(pack: CreditPack): number {
  const reference = packReferencePriceUsd(pack);
  if (reference <= pack.priceUsd) {
    return 0;
  }
  return Math.round(((reference - pack.priceUsd) / reference) * 100);
}

/** "Regular" price of the bump's credits at the entry rate, rounded to dollars. */
export function bumpReferencePriceUsd(bump: CreditBump = CREDIT_BUMP): number {
  return Math.round(bump.credits * BASE_UNIT_PRICE);
}

/** Whole-percent savings on the order bump versus the entry rate. */
export function bumpSavingsPercent(bump: CreditBump = CREDIT_BUMP): number {
  const reference = bumpReferencePriceUsd(bump);
  if (reference <= bump.priceUsd) {
    return 0;
  }
  return Math.round(((reference - bump.priceUsd) / reference) * 100);
}
