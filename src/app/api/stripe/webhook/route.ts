import type Stripe from "stripe";
import { creditsService } from "@/server/application/services";
import { getCreditPack } from "@/server/domain/credits/credits";
import {
  getStripeWebhookSecret,
  stripe,
} from "@/server/infrastructure/stripe/stripe";

/**
 * POST /api/stripe/webhook
 *
 * Receives Stripe events. Authenticated by the `stripe-signature` header (not a
 * user session), so it reads the raw request body and verifies the signature
 * before trusting anything.
 *
 * Credits are granted on a successful checkout, keyed off the buyer + pack
 * stamped into the session metadata:
 *  - Card and other synchronous methods settle immediately, arriving as
 *    `checkout.session.completed` with `payment_status: "paid"`.
 *  - Async methods (e.g. Boleto, Pix) arrive `completed` but `unpaid`; their
 *    money lands later as `checkout.session.async_payment_succeeded`. We grant
 *    only once the session is actually paid, so we never credit an unsettled
 *    payment.
 *
 * Grants are idempotent (keyed on the Stripe event id) so the at-least-once
 * delivery and retries can't double-credit a buyer.
 */
export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return new Response("Missing stripe-signature", { status: 400 });
  }

  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      rawBody,
      signature,
      getStripeWebhookSecret(),
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid signature";
    return new Response(`Webhook signature verification failed: ${message}`, {
      status: 400,
    });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const checkout = event.data.object as Stripe.Checkout.Session;
        // Only synchronous (already-paid) sessions settle here; async methods
        // are picked up below once payment actually succeeds.
        if (checkout.payment_status === "paid") {
          await grantForSession(event, checkout);
        }
        break;
      }
      case "checkout.session.async_payment_succeeded": {
        const checkout = event.data.object as Stripe.Checkout.Session;
        await grantForSession(event, checkout);
        break;
      }
      // Everything else (incl. `async_payment_failed`) grants nothing; we ack
      // with a 200 below so Stripe stops delivering it.
    }
  } catch (err) {
    console.error(
      `Failed to handle Stripe event ${event.id} (${event.type})`,
      err,
    );
    // Surface a 500 so Stripe retries the delivery.
    return new Response("Failed to process webhook", { status: 500 });
  }

  return new Response(null, { status: 200 });
}

/**
 * Grants the purchased credits for a paid checkout session, exactly once per
 * Stripe event. The total (pack + any order bump) is read from the
 * server-stamped `credits` metadata, falling back to the pack's credits for
 * older sessions. Missing/invalid metadata is logged and acked (not retryable);
 * a duplicate event is skipped without re-crediting.
 */
async function grantForSession(
  event: Stripe.Event,
  checkout: Stripe.Checkout.Session,
): Promise<void> {
  const userId = checkout.metadata?.userId;
  const credits = resolveCreditsToGrant(checkout);

  if (!userId || credits === null) {
    console.error("Stripe checkout session missing userId/credits metadata", {
      eventId: event.id,
      userId,
      pack: checkout.metadata?.pack,
      credits: checkout.metadata?.credits,
    });
    return;
  }

  const result = await creditsService.grantPurchase(
    event.id,
    event.type,
    userId,
    credits,
  );
  if (result === "duplicate") {
    console.info(`Stripe event ${event.id} already processed; skipping grant`);
  }
}

/**
 * Resolves how many credits a paid session should grant. Prefers the
 * server-stamped `credits` total (pack + order bump); falls back to the pack's
 * own credits when only `pack` is present. Returns `null` when neither yields a
 * positive integer.
 */
function resolveCreditsToGrant(
  checkout: Stripe.Checkout.Session,
): number | null {
  const raw = checkout.metadata?.credits;
  const parsed = raw ? Number.parseInt(raw, 10) : Number.NaN;
  if (Number.isInteger(parsed) && parsed > 0) {
    return parsed;
  }

  const pack = checkout.metadata?.pack
    ? getCreditPack(checkout.metadata.pack)
    : undefined;
  return pack ? pack.credits : null;
}
