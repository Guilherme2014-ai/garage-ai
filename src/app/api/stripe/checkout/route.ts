import { randomUUID } from "node:crypto";
import type Stripe from "stripe";
import { apiError, apiServerError, apiSuccess } from "@/lib/api/api-response";
import { requireAuthAPI } from "@/lib/auth/auth-utils";
import {
  CREDIT_BUMP,
  getCreditPack,
  isCreditPackId,
} from "@/server/domain/credits/credits";
import { AppError } from "@/server/domain/errors";
import {
  getStripeBumpPriceId,
  getStripePriceId,
  stripe,
} from "@/server/infrastructure/stripe/stripe";

/**
 * POST /api/stripe/checkout
 *
 * Body: `{ pack: CreditPackId, bump?: boolean, buildId?: string }`. Creates a
 * Stripe Checkout Session for the chosen credit pack — plus the discounted
 * order-bump credits when `bump` is set — and returns its URL for the client to
 * redirect to. The credits and price are resolved server-side (the client never
 * sends an amount); the buyer and the total credits to grant are stamped into
 * the session metadata so the webhook can grant them on completion.
 */
export async function POST(request: Request) {
  const { session, error } = await requireAuthAPI();
  if (error) return error;

  const userId = session.user?.id;
  if (!userId) {
    return apiError("Unable to resolve current account", 400);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("Expected a JSON request body", 400);
  }

  const {
    pack: packId,
    bump,
    buildId,
  } = (body ?? {}) as {
    pack?: unknown;
    bump?: unknown;
    buildId?: unknown;
  };
  if (!isCreditPackId(packId)) {
    return apiError("Unknown credit pack", 400);
  }

  const pack = getCreditPack(packId);
  if (!pack) {
    return apiError("Unknown credit pack", 400);
  }

  const withBump = bump === true;
  // Total credits to grant — pack plus the optional order bump. Computed
  // server-side and stamped into metadata so the webhook never trusts the
  // client for an amount.
  const totalCredits = pack.credits + (withBump ? CREDIT_BUMP.credits : 0);
  // Display total (USD) — analytics only; the authoritative charge is Stripe's.
  const totalPriceUsd = pack.priceUsd + (withBump ? CREDIT_BUMP.priceUsd : 0);

  // Shared id so the browser `Purchase` (fired on the success page) and the
  // server-side Conversions API `Purchase` (fired from the webhook) deduplicate
  // into one conversion in Meta. The Meta cookies let the server event match
  // back to the browser session.
  const fbEventId = randomUUID();
  const { fbp, fbc } = readMetaCookies(request);

  try {
    const origin =
      process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin;

    // Round-trip the build id so the buyer returns to the same session.
    const buildParam =
      typeof buildId === "string" && buildId
        ? `&build=${encodeURIComponent(buildId)}`
        : "";
    // Round-trip the pixel dedup id + total so the success page can fire the
    // browser-side Purchase that matches the server-side one.
    const pixelParams = `&fbEventId=${fbEventId}&fbValue=${totalPriceUsd}`;

    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
      { price: getStripePriceId(pack.id), quantity: 1 },
    ];

    // Prefer the dedicated Stripe price for the bump (first-class SKU, tracked in
    // the dashboard like the packs). Fall back to an inline price when the env
    // isn't configured so the add-on still works without a price id.
    if (withBump) {
      const bumpPriceId = getStripeBumpPriceId();
      lineItems.push(
        bumpPriceId
          ? { price: bumpPriceId, quantity: 1 }
          : {
              quantity: 1,
              price_data: {
                currency: "usd",
                unit_amount: CREDIT_BUMP.priceUsd * 100,
                product_data: {
                  name: `${CREDIT_BUMP.credits} bonus credits`,
                  description: "Discounted add-on credits",
                },
              },
            },
      );
    }

    const checkout = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: lineItems,
      success_url: `${origin}/customize?credits=success${buildParam}${pixelParams}`,
      cancel_url: `${origin}/customize?credits=cancelled${buildParam}`,
      client_reference_id: userId,
      metadata: {
        userId,
        pack: pack.id,
        credits: String(totalCredits),
        ...(withBump ? { bump: CREDIT_BUMP.id } : {}),
        // Meta Conversions API dedup id + match cookies, read by the webhook.
        fbEventId,
        ...(fbp ? { fbp } : {}),
        ...(fbc ? { fbc } : {}),
      },
    });

    if (!checkout.url) {
      return apiError("Could not start checkout", 502);
    }

    return apiSuccess({ url: checkout.url });
  } catch (err) {
    if (err instanceof AppError) {
      return apiError(err.message, err.statusCode, err.errorCode);
    }
    return apiServerError(err);
  }
}

/**
 * Reads Meta's `_fbp` / `_fbc` browser cookies from the request. They're set by
 * the pixel and, when forwarded to the Conversions API, let Meta match the
 * server event back to the browser session — the single biggest lever on
 * server-side match quality. Both are absent until the pixel is live.
 */
function readMetaCookies(request: Request): {
  fbp: string | null;
  fbc: string | null;
} {
  const header = request.headers.get("cookie");
  if (!header) return { fbp: null, fbc: null };

  const jar = new Map<string, string>();
  for (const part of header.split(";")) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    jar.set(part.slice(0, eq).trim(), part.slice(eq + 1).trim());
  }
  return { fbp: jar.get("_fbp") ?? null, fbc: jar.get("_fbc") ?? null };
}
