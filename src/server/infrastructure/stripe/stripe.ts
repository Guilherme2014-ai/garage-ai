import Stripe from "stripe";
import type { CreditPackId } from "@/server/domain/credits/credits";

/**
 * Returns the Stripe secret key, falling back to the existing `PROD_STRIPE_KEY`
 * env var. Fails fast with a clear message when neither is set (mirrors the
 * env-guard style of {@link import("@/server/infrastructure/database/db")}).
 */
function getStripeSecretKey(): string {
  const key =
    process.env.STRIPE_SECRET_KEY?.trim() ??
    process.env.PROD_STRIPE_KEY?.trim();
  if (!key) {
    throw new Error(
      "STRIPE_SECRET_KEY is not set. Add it to your environment to use Stripe.",
    );
  }
  return key;
}

// Reuse a single client across hot reloads in development.
const globalForStripe = globalThis as unknown as { __stripe?: Stripe };

export const stripe =
  globalForStripe.__stripe ?? new Stripe(getStripeSecretKey());
if (process.env.NODE_ENV !== "production") {
  globalForStripe.__stripe = stripe;
}

/** Maps each credit pack to the env var holding its live Stripe price id. */
const PRICE_ENV_BY_PACK: Record<CreditPackId, string> = {
  p60: "STRIPE_PRICE_P60",
  p120: "STRIPE_PRICE_P120",
  p240: "STRIPE_PRICE_P240",
};

/**
 * Resolves the configured Stripe price id for a pack. Throws when the env var
 * is missing so checkout fails loudly rather than charging the wrong amount.
 */
export function getStripePriceId(pack: CreditPackId): string {
  const envName = PRICE_ENV_BY_PACK[pack];
  const priceId = process.env[envName]?.trim();
  if (!priceId) {
    throw new Error(`${envName} is not set. Configure the Stripe price ids.`);
  }
  return priceId;
}

/** Webhook signing secret used to verify incoming Stripe events. */
export function getStripeWebhookSecret(): string {
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!secret) {
    throw new Error(
      "STRIPE_WEBHOOK_SECRET is not set. Add it to verify Stripe webhooks.",
    );
  }
  return secret;
}
