# Meta (Facebook) Pixel

Garage AI tracks conversions with **both** the browser pixel and the server-side
**Conversions API (CAPI)**, deduplicated by a shared `event_id`. This is Meta's
recommended setup: the browser pixel covers rich client signals, while CAPI
survives ad blockers, cookie loss and iOS restrictions — together they recover
conversions a browser-only pixel misses.

Everything is **off by default**. With the env vars below unset, the pixel
component renders nothing and every tracking call is a no-op, so the app behaves
exactly as before until you paste in real values.

## Environment variables

| Variable | Where it's used | Required for | How to get it |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_META_PIXEL_ID` | Browser + server | Browser pixel (PageView, ViewContent, InitiateCheckout, Purchase, CompleteRegistration) | Events Manager → **Data sources** → your pixel → copy the numeric **Pixel ID** |
| `META_CONVERSIONS_API_TOKEN` | Server only (secret) | Server-side `Purchase` via CAPI | Events Manager → your pixel → **Settings** → **Conversions API** → **Generate access token** |
| `META_TEST_EVENT_CODE` | Server only | Testing CAPI before go-live | Events Manager → **Test events** → copy the `TESTxxxxx` code. **Leave blank in production.** |

`NEXT_PUBLIC_*` is inlined into the client bundle at **build time** — after
setting it you must rebuild/redeploy (a running `next dev` also needs a restart).

## First-time setup

1. Create a pixel: Events Manager → Connect data sources → **Web**.
2. Put the Pixel ID in `NEXT_PUBLIC_META_PIXEL_ID`, restart, load the site, and
   confirm `PageView` in **Test events** (or the [Meta Pixel Helper] extension).
3. Generate a Conversions API token, put it in `META_CONVERSIONS_API_TOKEN`.
4. Set `META_TEST_EVENT_CODE`, run a test purchase, and confirm the `Purchase`
   shows as **received from both Browser and Server, deduplicated** in Test
   events. Then clear `META_TEST_EVENT_CODE` for production.
5. In Events Manager, turn on **Automatic Advanced Matching** — it hashes
   emails/phones from form fields to lift match quality with no code change.

## Events we send

| Event | Where | Channel |
| --- | --- | --- |
| `PageView` | Every page + client-side route change | Browser |
| `ViewContent` | *(helper available; not yet wired)* | Browser |
| `InitiateCheckout` | Clicking **Continue** in the credits dialog | Browser |
| `CompleteRegistration` | Successful email signup | Browser |
| `Purchase` | Paid Stripe checkout | **Browser + CAPI** (deduped by `event_id`) |

### How `Purchase` deduplication works

1. `POST /api/stripe/checkout` mints a `fbEventId`, captures the `_fbp`/`_fbc`
   cookies, stamps all three into the Stripe session metadata, and appends
   `fbEventId` + total to the success URL.
2. The Stripe **webhook** (source of truth for money) fires the CAPI `Purchase`
   with that `fbEventId`, the settled amount, the buyer's hashed email, and the
   cookies — only once per event (idempotent with the credit grant).
3. The **success page** fires the browser `Purchase` with the same `fbEventId`.

Meta collapses the two into one conversion. The browser event can fire on the
success redirect before an async payment (e.g. Pix/Boleto) settles; the CAPI
event only fires once truly paid, so treat CAPI as authoritative.

## Code map

- `src/lib/analytics/meta-pixel/config.ts` — env resolution + `window.fbq` types
- `src/lib/analytics/meta-pixel/MetaPixel.tsx` — base code + SPA PageView (in root layout)
- `src/lib/analytics/meta-pixel/events.ts` — typed browser event helpers
- `src/server/infrastructure/meta/capi.ts` — server-side Conversions API sender

To add a new browser event, call a helper from `events.ts` (or add one). To send
it server-side too, call `sendMetaConversion` with the same `eventId`.

[Meta Pixel Helper]: https://chromewebstore.google.com/detail/meta-pixel-helper/fdgfkebogiimcoedlicjlajpkdmockpc
