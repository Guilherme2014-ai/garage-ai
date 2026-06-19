import { apiError, apiServerError, apiSuccess } from "@/lib/api/api-response";
import { requireAuthAPI } from "@/lib/auth/auth-utils";
import { getCreditPack, isCreditPackId } from "@/server/domain/credits/credits";
import { AppError } from "@/server/domain/errors";
import {
  getStripePriceId,
  stripe,
} from "@/server/infrastructure/stripe/stripe";

/**
 * POST /api/stripe/checkout
 *
 * Body: `{ pack: CreditPackId }`. Creates a Stripe Checkout Session for the
 * chosen credit pack and returns its URL for the client to redirect to. The
 * credits and price are resolved server-side from the pack id — the client
 * never sends an amount — and the buyer + credits are stamped into the session
 * metadata so the webhook can grant them on completion.
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

  const { pack: packId, buildId } = (body ?? {}) as {
    pack?: unknown;
    buildId?: unknown;
  };
  if (!isCreditPackId(packId)) {
    return apiError("Unknown credit pack", 400);
  }

  const pack = getCreditPack(packId);
  if (!pack) {
    return apiError("Unknown credit pack", 400);
  }

  try {
    const origin =
      process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin;

    // Round-trip the build id so the buyer returns to the same session.
    const buildParam =
      typeof buildId === "string" && buildId
        ? `&build=${encodeURIComponent(buildId)}`
        : "";

    const checkout = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{ price: getStripePriceId(pack.id), quantity: 1 }],
      success_url: `${origin}/customize?credits=success${buildParam}`,
      cancel_url: `${origin}/customize?credits=cancelled${buildParam}`,
      client_reference_id: userId,
      metadata: { userId, pack: pack.id, credits: String(pack.credits) },
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
