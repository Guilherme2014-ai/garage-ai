/**
 * Client-side wrappers around the credits + checkout routes. Mirrors the shape
 * of {@link import("./customizeApi")}.
 */

import type { PlanMode } from "../core/plan/planMode";

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

/** Reads the current balance and plan mode. */
export async function fetchCredits(): Promise<{
  credits: number;
  planMode: PlanMode;
}> {
  const response = await fetch("/api/credits");
  return unwrap<{ credits: number; planMode: PlanMode }>(response);
}

export type ChargeResult =
  | { ok: true; credits: number }
  | { ok: false; insufficient: boolean };

/**
 * Charges one category modification. Returns a result object instead of
 * throwing so the caller can branch on "insufficient credits" (HTTP 402)
 * without inspecting error messages.
 */
export async function chargeCategory(): Promise<ChargeResult> {
  const response = await fetch("/api/customize/credits/charge", {
    method: "POST",
  });
  if (response.ok) {
    const data = await unwrap<{ credits: number }>(response);
    return { ok: true, credits: data.credits };
  }
  return { ok: false, insufficient: response.status === 402 };
}
