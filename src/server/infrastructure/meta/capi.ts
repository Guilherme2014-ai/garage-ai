import { createHash } from "node:crypto";
import { META_PIXEL_ID } from "@/lib/analytics/meta-pixel/config";

/**
 * Meta Conversions API (server-side pixel).
 *
 * Sends conversion events straight from our servers to Meta, complementing the
 * browser pixel. Server events survive ad blockers, cookie loss and iOS
 * restrictions, so they materially improve attribution — Meta recommends
 * running both channels and deduplicating them with a shared `eventId`.
 *
 * Everything degrades gracefully: with no pixel id or access token configured,
 * {@link sendMetaConversion} is a no-op. It also never throws — analytics must
 * not be able to break the checkout/webhook flow that calls it.
 *
 * @see https://developers.facebook.com/docs/marketing-api/conversions-api
 */

/** Graph API version to target. Bump deliberately; Meta supports each for ~2y. */
const GRAPH_API_VERSION = "v21.0";

/** Server-side access token, generated in Events Manager → Settings. */
function getAccessToken(): string {
  return process.env.META_CONVERSIONS_API_TOKEN?.trim() || "";
}

/**
 * Optional test-event code (Events Manager → Test Events). When set, events are
 * routed to the Test Events tool for verification instead of production metrics.
 * Leave unset in production.
 */
function getTestEventCode(): string {
  return process.env.META_TEST_EVENT_CODE?.trim() || "";
}

/** Whether the server-side API is fully configured. */
export function isMetaConversionsEnabled(): boolean {
  return META_PIXEL_ID.length > 0 && getAccessToken().length > 0;
}

/** SHA-256 hex of a normalized string, as Meta requires for PII fields. */
function hash(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

/** Customer identifiers used for matching. Provide as much as you have. */
export interface MetaUserData {
  /** Plain email — hashed here before sending. */
  email?: string | null;
  /** Plain phone (any format) — digits extracted and hashed here. */
  phone?: string | null;
  /** Your stable user id — hashed and sent as `external_id`. */
  externalId?: string | null;
  /** `_fbp` browser cookie value (raw, not hashed). */
  fbp?: string | null;
  /** `_fbc` browser cookie value (raw, not hashed). */
  fbc?: string | null;
  /** Originating client IP (raw). */
  clientIpAddress?: string | null;
  /** Originating client user-agent (raw). */
  clientUserAgent?: string | null;
}

export interface MetaConversionEvent {
  /** Standard event name, e.g. "Purchase". */
  eventName: string;
  /** Shared dedup id — must match the browser event's `eventID`. */
  eventId: string;
  /** Page URL the conversion is attributed to. */
  eventSourceUrl?: string;
  /** Unix seconds; defaults to now. */
  eventTime?: number;
  /** Where the event happened. "website" for browser-originated flows. */
  actionSource?: "website" | "app" | "phone_call" | "chat" | "system_generated";
  userData: MetaUserData;
  customData?: Record<string, unknown>;
}

/** Builds Meta's `user_data` object, hashing PII and dropping empty fields. */
function buildUserData(user: MetaUserData): Record<string, unknown> {
  const out: Record<string, unknown> = {};

  const email = user.email?.trim().toLowerCase();
  if (email) out.em = [hash(email)];

  const phoneDigits = user.phone?.replace(/\D/g, "");
  if (phoneDigits) out.ph = [hash(phoneDigits)];

  if (user.externalId) out.external_id = [hash(user.externalId)];
  if (user.fbp) out.fbp = user.fbp;
  if (user.fbc) out.fbc = user.fbc;
  if (user.clientIpAddress) out.client_ip_address = user.clientIpAddress;
  if (user.clientUserAgent) out.client_user_agent = user.clientUserAgent;

  return out;
}

/**
 * Sends a single conversion event. Fire-and-forget from the caller's
 * perspective: it resolves to `true`/`false` for optional logging but never
 * rejects, so a Meta outage can't fail a real user action.
 */
export async function sendMetaConversion(
  event: MetaConversionEvent,
): Promise<boolean> {
  if (!isMetaConversionsEnabled()) {
    return false;
  }

  const payload: Record<string, unknown> = {
    data: [
      {
        event_name: event.eventName,
        event_time: event.eventTime ?? Math.floor(Date.now() / 1000),
        event_id: event.eventId,
        event_source_url: event.eventSourceUrl,
        action_source: event.actionSource ?? "website",
        user_data: buildUserData(event.userData),
        custom_data: event.customData,
      },
    ],
  };

  const testCode = getTestEventCode();
  if (testCode) {
    payload.test_event_code = testCode;
  }

  const url = `https://graph.facebook.com/${GRAPH_API_VERSION}/${META_PIXEL_ID}/events?access_token=${encodeURIComponent(
    getAccessToken(),
  )}`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error(
        `Meta Conversions API rejected ${event.eventName} (${res.status})`,
        detail,
      );
      return false;
    }
    return true;
  } catch (err) {
    console.error(
      `Meta Conversions API request failed for ${event.eventName}`,
      err,
    );
    return false;
  }
}
