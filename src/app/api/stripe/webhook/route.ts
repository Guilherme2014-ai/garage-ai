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
 * before trusting anything. On `checkout.session.completed` it grants the
 * purchased pack's credits and upgrades the buyer to `top-up`.
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

  if (event.type === "checkout.session.completed") {
    const checkout = event.data.object as Stripe.Checkout.Session;
    const userId = checkout.metadata?.userId;
    const packId = checkout.metadata?.pack;
    const pack = packId ? getCreditPack(packId) : undefined;

    if (userId && pack) {
      try {
        await creditsService.grantPurchase(userId, pack);
      } catch (err) {
        console.error("Failed to grant credits for checkout", err);
        // Surface a 500 so Stripe retries the delivery.
        return new Response("Failed to grant credits", { status: 500 });
      }
    } else {
      console.error("checkout.session.completed missing userId/pack metadata", {
        userId,
        packId,
      });
    }
  }

  return new Response(null, { status: 200 });
}
