/**
 * Client-side wrapper around the Stripe checkout route. Lives in the credits
 * feature (not customize) so the shared purchase UI has no dependency on
 * customize — customize depends on credits, never the other way around.
 */

import type { CreditPackId } from "@/lib/credits/credits";

interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  message?: string;
}

async function unwrap<T>(response: Response): Promise<T> {
  let payload: ApiEnvelope<T> | null = null;
  try {
    payload = (await response.json()) as ApiEnvelope<T>;
  } catch {
    // fall through to status-based error
  }
  if (!response.ok || !payload?.success || payload.data === undefined) {
    const message = payload?.message ?? `Request failed (${response.status})`;
    throw new Error(message);
  }
  return payload.data;
}

/**
 * Starts checkout for a pack and returns the Stripe-hosted URL. Pass `bump` to
 * add the discounted order-bump credits to the same session. The optional
 * `buildId` is round-tripped into the success/cancel redirect so the user lands
 * back on the same build session after paying.
 */
export async function startCreditCheckout(
  pack: CreditPackId,
  options: { buildId?: string | null; bump?: boolean } = {},
): Promise<string> {
  const response = await fetch("/api/stripe/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      pack,
      bump: options.bump ?? false,
      buildId: options.buildId ?? undefined,
    }),
  });
  const data = await unwrap<{ url: string }>(response);
  return data.url;
}
