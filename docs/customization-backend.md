# Customization Backend (API + AI)

This document covers the server side of the customization feature: the API
routes, the application services, the AI providers (WaveSpeed), prompt building,
Blob storage, concurrency control, and environment variables. For the
browser-side domain logic, see [`customization-logic.md`](./customization-logic.md).

## Layering

The backend follows a consistent `route → use-case → service → infrastructure`
flow, mirroring the existing auth feature:

```text
src/app/api/customize/<route>/route.ts        HTTP boundary (auth, parse, envelope)
src/server/application/use-cases/<name>/       thin orchestration wrappers
src/server/application/services/<feature>/     validation + business logic
src/server/infrastructure/<provider>/          external integrations (WaveSpeed, Blob)
```

- Routes only authenticate, parse/validate the request, call a use-case, and
  shape the response with the shared envelope helpers.
- Use-cases are thin pass-throughs to a service (e.g. `editCarImage`,
  `generateCustomizationOptions`, `uploadCarImage`).
- Services own validation and orchestration; they never deal with HTTP.
- Infrastructure wraps third parties (WaveSpeed SDK, Vercel Blob).

All routes are protected with `requireAuthAPI()` and return the shared envelope:
`{ success: true, data }` or `{ success: false, message, errorCode? }`
(`src/lib/api/api-response.ts`).

## API Routes

### `POST /api/customize/upload`

Seeds the flow with the user's base car photo.

- Request: `multipart/form-data` with an `image` File.
- Response `201`: `{ url }` — the public Blob URL.
- Service: `carImageService.uploadBaseImage` (validates type/size, uploads to
  Blob under `car-uploads/`).

### `POST /api/customize/options`

Generates vehicle-aware, ranked options via the LLM. The **LLM chooses the
categories itself** (per-vehicle), just like the options — the backend does not
dictate a category set. Both the number of categories and the per-category option
count are **gated by the caller's plan mode** (`maxCategories` /
`optionsPerCategory`; see
[`pricing-and-plan-modes.md`](./pricing-and-plan-modes.md)); the route resolves
the plan from the signed-in user, so it is not part of the request body. The
canonical list in `customization-options/categories.ts` is **mock-only** (it
backs `MOCK_AI_CALLS` runs); the `categories` body field is optional and only
seeds mock mode.

- Request (JSON): `{ car: string, categories?: string[] }` (`categories`
  mock-only).
- Response `201`:

```jsonc
{
  "car": "Nissan Skyline GT-R R34",
  "vehicleProfile": { "style": "JDM", "era": "...", "summary": "..." },
  "categories": {
    "wheels": [
      {
        "rank": 1,
        "name": "TE37",
        "brand": "Volk Racing (Rays)",
        "description": "…why it fits…",
        "visualDescription": "bronze 6-spoke forged wheels, deep concave face",
        "price": 1450,
        "colorHex": "#b45309",   // optional
        "tags": ["JDM", "forged"]
      }
      // exactly `optionsPerCategory` options for the plan (free 5, top-up 12), ranked
    ]
    // exactly `maxCategories` keys — slugs the LLM chose for this vehicle
  },
  "planMode": "free" // or "top-up" — the plan the options were generated under
}
```

- Use-case/service: `generateCustomizationOptions` → `customizationOptionsService`.

### `POST /api/customize/edit`

Applies a single option to a car image. The prompt is built **server-side** from
`name` + `visualDescription`; clients never send a raw prompt.

- Request, two shapes:
  - JSON (customization flow): `{ imageUrl, name, visualDescription, outputFormat?, resolution? }`
  - `multipart/form-data` (first upload): `image` File + `name` + `visualDescription`
- Response `201`: `{ imageUrl, sourceUrl }` — `imageUrl` is the new car state.
- Use-case/service: `editCarImage` → `carImageService.editCarImage`.

## Services

### `customizationOptionsService.generateOptions`

`src/server/application/services/customization-options/`

1. `normalizeInput`: trims the car name, defaults the plan mode, and
   lowercases/dedupes any client-sent categories (mock-only, capped to the plan's
   `maxCategories`).
2. Builds the system + user prompt (see Prompts), telling the model to choose
   exactly `maxCategories` vehicle-appropriate categories and the plan's
   `optionsPerCategory` options each. (Mock mode skips the LLM and uses the
   client's categories, or the `categories.ts` fallback.)
3. Calls `generateText` (the provider selected by `LLM_PROVIDER`; see AI Providers).
4. `extractJson`: strips code fences and parses the first `{...}` block.
5. `buildResult`: reads the **dynamic** category keys the LLM returned, slugifies
   each, coerces options, drops entries missing `name`/`brand`, re-ranks to array
   order, keeps only categories meeting the plan's `optionsPerCategory` bar, and
   caps the set at `maxCategories`. Throws only if no valid category survives.
   The result is stamped with `planMode`.

Plan limits come from `getPlanLimits(planMode)`; see
[`pricing-and-plan-modes.md`](./pricing-and-plan-modes.md).

### `carImageService`

`src/server/application/services/car-image/`

- `uploadBaseImage(file)`: validates (JPEG/PNG/WebP, ≤25 MB) and uploads to Blob.
- `editCarImage(input)`: resolves the source image (prefers `imageUrl`; otherwise
  uploads the `image` File), builds the prompt via `buildCarEditPrompt`, calls
  `editImage` (WaveSpeed nano-banana), and returns `{ imageUrl, sourceUrl }`. If
  the edit fails after a temporary upload, that upload is best-effort deleted.

## Prompts

### Options prompt (`customization-options/promptBuilder.ts`)

- `buildSystemPrompt()`: frames the model as a senior automotive customization
  specialist with cross-scene knowledge (JDM, Euro, Muscle, Supercar, Track,
  Drift, Stance) and demands **valid JSON only**.
- `buildUserPrompt({ car, planMode })`: injects the vehicle and tells the model
  to choose exactly `maxCategories` vehicle-appropriate category slugs itself,
  asks for exactly the plan's `optionsPerCategory` options each, and pins
  the exact JSON schema, including the rules for `visualDescription` (a concise,
  purely visual phrase for the image model — no brand names), `price` (USD
  integer estimate), and optional `colorHex`.

### Edit prompt (`car-image/editPromptBuilder.ts`)

`buildCarEditPrompt({ name, visualDescription })` wraps the option into a prepared
template so wording stays centralized:

```text
You are a car modification image model that edits an existing photo of a car.

- Replace or add the following car equipment: "{name}: {visualDescription}".
- Apply this modification on top of the car's current state, preserving every
  modification already present in the image.
- Keep the same car identity, body, camera angle, perspective, framing,
  lighting, and background. Only change what the requested equipment affects.
- Produce a photorealistic result consistent with the original photo.
```

## AI Providers

### Text LLM provider selection

`src/server/infrastructure/llm/`

- `types.ts` — provider-agnostic `GenerateTextOptions` / `GenerateText` contract
  both text providers implement.
- `index.ts` — exports `generateText()`, which dispatches to the provider chosen
  by the `LLM_PROVIDER` env var: `"wavespeed"` (default) or `"openrouter"`.
  Unknown/unset values fall back to WaveSpeed, preserving existing behavior.
- Consumers (e.g. `customization-options.service.ts`) import `generateText` from
  `@/server/infrastructure/llm` rather than a specific vendor module. The model
  can be overridden globally with `LLM_MODEL`; when unset each provider uses its
  own default.

#### OpenRouter (`src/server/infrastructure/openrouter/openrouter-llm.ts`)

- `generateText()` calls OpenRouter's chat-completions endpoint via
  `@openrouter/sdk` (default model `openai/gpt-4o-mini`), reading
  `OPENROUTER_API_KEY` from the environment. The `systemPrompt`/`prompt` are sent
  as `system`/`user` messages and the first choice's text content is returned.

### WaveSpeed (`src/server/infrastructure/wavespeed/`)

- `wavespeed-llm.ts` — `generateText()` calls model endpoint
  `wavespeed-ai/any-llm` (default LLM `openai/gpt-5-chat`). Returns the completion
  string; if the SDK returns a URL instead of inline text, it transparently
  fetches it.
- `wavespeed-image-editor.ts` — `editImage()` calls `google/nano-banana-2/edit`
  with the source image URL(s) and prompt; returns the output image URL.
- The WaveSpeed SDK reads `WAVESPEED_API_KEY` from the environment and polls each
  task to completion, so calls resolve once `outputs` is populated.

### Concurrency gate (`wavespeed-concurrency.ts`)

Every WaveSpeed call (LLM and image edits) is funneled through a single
process-wide counting semaphore via `runWithWaveSpeedLimit(task)`. This caps
in-flight calls so the per-category fan-out (one edit per option) never exceeds
the account limit.

- Limit comes from `WAVESPEED_CONCURRENCY_LENGHT` (note: the env var is spelled
  this way in code), defaulting to `15` when unset/invalid.
- The gate is **per server instance**: with N instances the effective limit is
  `N * WAVESPEED_CONCURRENCY_LENGHT`.
- It complements the client-side `PREVIEW_CONCURRENCY` fan-out ceiling in the
  coordinator; the server-side gate is authoritative.

## Storage (Vercel Blob)

`src/server/infrastructure/storage/blob-storage.ts` — `uploadToBlob(pathname,
file)` wraps `@vercel/blob` `put` (public access, random suffix) and returns the
URL plus a `delete()` for cleanup. Uses `BLOB_READ_WRITE_TOKEN`.

Paths: base uploads under `car-uploads/`, edit-time file uploads under
`car-customizations/`.

## Environment Variables

| Variable | Purpose | Default |
| --- | --- | --- |
| `WAVESPEED_API_KEY` | WaveSpeed SDK auth (LLM + image edits) | — (required) |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob read/write token | — (required) |
| `WAVESPEED_CONCURRENCY_LENGHT` | Max concurrent WaveSpeed calls per instance | `15` |
| `AUTH_SECRET` | NextAuth session secret | — (required) |
| `DATABASE_URL` | Postgres connection (Drizzle); backs users + plan modes | — (required) |

> Users are persisted in Postgres via Drizzle, so authenticated routes now
> require a provisioned, migrated database. See
> [`pricing-and-plan-modes.md`](./pricing-and-plan-modes.md).

## Notes & Trade-offs

- Both AI calls are synchronous request/response (the SDK polls to completion),
  so options generation and each image edit take seconds. The UI shows
  generating states for both. A future improvement could stream or move work to
  a background job.
- `next/image` is intentionally avoided for AI/Blob output images (dynamic remote
  hosts would require `images.remotePatterns` config); the UI uses plain `<img>`.
