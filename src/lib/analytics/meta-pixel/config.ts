/**
 * Meta (Facebook) Pixel configuration, resolved from the environment.
 *
 * Everything here is optional: when `NEXT_PUBLIC_META_PIXEL_ID` isn't set the
 * pixel component renders nothing and the client event helpers become no-ops,
 * so the app runs unchanged until you paste in the real id from Meta Events
 * Manager. The server-side Conversions API token lives in
 * {@link import("@/server/infrastructure/meta/capi")} (server-only) — never here,
 * because this module is imported into the browser bundle.
 */

/**
 * Public Pixel ID. Safe to expose — it's embedded in every page's HTML anyway.
 * `NEXT_PUBLIC_` vars are inlined at build time, so this reads correctly in both
 * the browser and on the server.
 */
export const META_PIXEL_ID =
  process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim() || "";

/** Whether the browser pixel is configured. Gates all client-side tracking. */
export const isMetaPixelEnabled = META_PIXEL_ID.length > 0;

/**
 * The subset of Meta standard events we emit. Using a union keeps call sites
 * honest and prevents typos silently dropping conversions.
 * @see https://developers.facebook.com/docs/meta-pixel/reference
 */
export type MetaStandardEvent =
  | "PageView"
  | "ViewContent"
  | "InitiateCheckout"
  | "AddPaymentInfo"
  | "Purchase"
  | "Lead"
  | "CompleteRegistration"
  | "Search"
  | "Contact";

/** Options accepted alongside a tracked event (chiefly the dedup key). */
export interface MetaEventOptions {
  /**
   * Shared id used to deduplicate this browser event against the matching
   * server-side Conversions API event. Same `eventID` + event name within
   * ~48h collapses to a single conversion in Meta's reporting.
   */
  eventID?: string;
}

/** The `fbq` function injected by the Meta base code. */
type FbqFn = (
  command: "init" | "track" | "trackCustom" | "consent",
  targetOrEvent?: string,
  params?: Record<string, unknown>,
  options?: MetaEventOptions,
) => void;

declare global {
  interface Window {
    fbq?: FbqFn & { queue?: unknown[]; loaded?: boolean };
    _fbq?: unknown;
  }
}
