/**
 * Client-side Meta Pixel event helpers.
 *
 * Thin, typed wrappers over `window.fbq`. Every helper is a safe no-op when the
 * pixel isn't configured or `fbevents.js` hasn't loaded yet, so call sites never
 * need to guard. Standard-event names and parameters follow Meta's reference:
 * https://developers.facebook.com/docs/meta-pixel/reference
 */

import {
  isMetaPixelEnabled,
  type MetaEventOptions,
  type MetaStandardEvent,
} from "./config";

/** Fires a Meta standard event with optional parameters and a dedup `eventID`. */
export function trackEvent(
  event: MetaStandardEvent,
  params?: Record<string, unknown>,
  options?: MetaEventOptions,
): void {
  if (!isMetaPixelEnabled || typeof window === "undefined") return;
  // `fbq` is defined synchronously by the base snippet and queues calls until
  // the script loads, so this is only ever missing when the pixel is unset.
  window.fbq?.("track", event, params, options);
}

/** Fires a non-standard, app-specific event. */
export function trackCustomEvent(
  event: string,
  params?: Record<string, unknown>,
): void {
  if (!isMetaPixelEnabled || typeof window === "undefined") return;
  window.fbq?.("trackCustom", event, params);
}

/** Viewed a key piece of content (e.g. opened the customize workspace). */
export function trackViewContent(params?: {
  content_name?: string;
  content_category?: string;
  content_ids?: string[];
}): void {
  trackEvent("ViewContent", params);
}

/** Started checkout for a credit pack. `value` is the total price in USD. */
export function trackInitiateCheckout(params: {
  value: number;
  currency?: string;
  contentIds?: string[];
  numItems?: number;
}): void {
  trackEvent("InitiateCheckout", {
    value: params.value,
    currency: params.currency ?? "USD",
    content_ids: params.contentIds,
    content_type: "product",
    num_items: params.numItems,
  });
}

/**
 * Completed a purchase. Pass the same `eventID` used by the server-side
 * Conversions API event so Meta deduplicates the two into one conversion.
 */
export function trackPurchase(
  params: {
    value: number;
    currency?: string;
    contentIds?: string[];
    numItems?: number;
  },
  options?: MetaEventOptions,
): void {
  trackEvent(
    "Purchase",
    {
      value: params.value,
      currency: params.currency ?? "USD",
      content_ids: params.contentIds,
      content_type: "product",
      num_items: params.numItems,
    },
    options,
  );
}

/** Finished signing up for an account. */
export function trackCompleteRegistration(params?: { method?: string }): void {
  trackEvent("CompleteRegistration", {
    status: true,
    content_name: params?.method,
  });
}
