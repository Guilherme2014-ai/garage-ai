# Pricing & Plan Modes

The first slice of pricing logic. Every user belongs to a **plan mode** that
gates what the customization flow gives them. This document covers the plan
model, the database that now backs users, and how the gate is enforced on the
backend and surfaced in the UI.

For the rest of the customization feature, see
[`customization-backend.md`](./customization-backend.md) (server) and
[`customization-logic.md`](./customization-logic.md) (frontend).

## Plan modes

Two modes:

| Plan | Categories | Options / category | Download |
| --- | --- | --- | --- |
| `free` | 3 | 5 | blocked (shows upsell) |
| `top-up` | 5 | 12 | allowed |

New users default to `free`. A user becomes `top-up` automatically when they
**purchase credits** (see [Credits](#credits)); a plan can also still be set
directly on the `plan_mode` column for testing (see
[Assigning a plan](#assigning-a-plan)).

## Credits

On top of plan mode, every user has a **credit balance** that meters how many
category modifications they can make.

- **Cost:** entering a category to generate its per-option previews costs
  `CREDITS_PER_CATEGORY` (**5**) credits, charged the first time that category is
  entered in a build. Re-entering an already-paid category — switching back,
  history nav, undo/redo, reset — is free.
- **Starting balance:** new users get `STARTING_CREDITS` (**15**) = 3 free
  category modifications.
- **Packs:** credits are sold via Stripe Checkout in three one-time packs —
  **60 / $5**, **120 / $10**, **240 / $20**. A completed purchase adds the
  pack's credits **and** upgrades the buyer to `top-up`.

The canonical definitions live in one framework-agnostic module, mirroring
`plan-mode.ts`:

```text
src/lib/credits/credits.ts   STARTING_CREDITS, CREDITS_PER_CATEGORY,
                             CREDIT_PACKS, getCreditPack, isCreditPackId
```

with the same thin re-exports for the server
(`src/server/domain/credits/credits.ts`) and client
(`src/features/customize/core/credits/credits.ts`) layers.

### Charging flow

```text
Enter a new category (first time in the build)
  POST /api/customize/credits/charge
    creditsService.chargeForCategory(userId)
      userRepository.decrementCredits(userId, 5)   -- atomic, guarded by credits >= 5
    -> { credits }                                  -- new balance, or 402 INSUFFICIENT_CREDITS
```

The decrement is a single guarded SQL statement (`set credits = credits - 5
where id = ? and credits >= 5`), so concurrent charges can't overspend. On 402
the client opens the buy-credits dialog instead of generating previews. The
"already paid this category" check is tracked per build session in the
`useCustomization` hook (consistent with the in-memory caches that reset on
refresh — a refresh + re-enter can recharge).

### Single source of truth

The plan type and its limits are defined once, in a framework-agnostic module
both layers import:

```text
src/lib/plan/plan-mode.ts        canonical: PlanMode, PLAN_LIMITS,
                                  DEFAULT_PLAN_MODE, isPlanMode, getPlanLimits
```

Thin re-exports keep each layer's import paths stable and preserve the
client/server boundary (the feature never reaches into `@/server`):

- `src/server/domain/plan/plan-mode.ts` → `export * from "@/lib/plan/plan-mode"`
- `src/features/customize/core/plan/planMode.ts` →
  `export type { PlanMode } from "@/lib/plan/plan-mode"`

Because the client side only uses `import type` / `export type`, the runtime
values (`PLAN_LIMITS`, etc.) are never pulled into the browser bundle.

`PLAN_LIMITS` is the one place to change a privilege:

```ts
export const PLAN_LIMITS: Record<PlanMode, PlanLimits> = {
  free:     { maxCategories: 3, optionsPerCategory: 5,  canDownload: false },
  "top-up": { maxCategories: 5, optionsPerCategory: 12, canDownload: true  },
};
```

## Database (Drizzle + Postgres)

Users moved from an in-memory array to a real Postgres database via Drizzle
(postgres.js driver). **Auth now requires a provisioned, migrated database.**

```text
drizzle.config.ts                                   drizzle-kit config (dialect, schema, out)
src/server/infrastructure/database/schema.ts        `users` table (incl. plan_mode)
src/server/infrastructure/database/db.ts            postgres.js client + drizzle instance
src/server/repositories/user.repository.ts          Drizzle-backed repo (same interface)
drizzle/                                             generated SQL migrations + meta
```

### `users` table

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid | PK, `defaultRandom()` |
| `email` | text | unique, not null |
| `name` | text | not null |
| `password` | text | nullable (OAuth users) |
| `image` | text | nullable |
| `provider` | text | nullable |
| `provider_id` | text | nullable |
| `plan_mode` | text | not null, default `'free'` |
| `credits` | integer | not null, default `15` |
| `created_at` / `updated_at` | timestamptz | `defaultNow()` |

`plan_mode` is plain text so new plans can be added without a schema migration;
`isPlanMode()` coerces unknown values back to the default on read.

### Repository

`userRepository` keeps the exact async interface it had before
(`findAll/findByEmail/findById/findByProviderId/create/update/delete`), so
`authService` and the signup use-case are unchanged. A `toEntity` mapper
converts rows to the domain `UserEntity` (which now carries `planMode`).

### Scripts & workflow

```bash
npm run db:generate   # generate a migration from schema changes
npm run db:migrate    # apply pending migrations
npm run db:push       # push schema directly (no migration file)
npm run db:studio     # browse/edit data (incl. flipping plan_mode)
```

Config reads `DATABASE_URL`; `db.ts` fails fast with a clear error if it's unset
and reuses a single client across hot reloads in development.

## Backend gating

The plan is resolved from the signed-in user and threaded through the existing
`route → use-case → service` flow.

```text
POST /api/customize/options
  requireAuthAPI()                          -> session.user.id
  planService.getPlanModeForUserId(id)      -> reads users.plan_mode (default free)
  generateCustomizationOptions({ car, categories, planMode })
    customizationOptionsService.generateOptions
      normalizeInput   -> caps categories to limits.maxCategories
      buildUserPrompt  -> asks for exactly limits.optionsPerCategory options
      buildResult      -> requires >= optionsPerCategory valid options, slices
  response includes "planMode"
```

Key points:

- `planService` (`src/server/application/services/plan.service.ts`) is the only
  place the request learns its plan: `getPlanModeForUserId` /
  `getPlanModeForEmail`, both falling back to `DEFAULT_PLAN_MODE`.
- `normalizeInput` slices the requested categories to `maxCategories`, so a free
  request for all categories yields only the first three.
- The prompt and `buildResult` are driven by `getPlanLimits(planMode)
  .optionsPerCategory` — no more hard-coded option count.
- **Mock mode** (`MOCK_AI_CALLS=true`) honors the same caps, so plan gating is
  visible in local dev without spending API credits.
- The response carries `planMode` so the client doesn't need a second round-trip
  to learn the user's plan.

## Frontend

`planMode` flows from the options response into the workspace and drives three
behaviors:

```text
CarIntakeForm.onReady(data, carName, planMode)
  -> CustomizeFlow stores it
  -> CustomizeWorkspace(planMode)
```

- **Categories shown.** `getActiveCategories(data)` (in
  `core/customization-options/catalog.ts`) returns the `CATEGORY_ORDER`
  categories that actually have options, so free users see exactly their three.
  The category nav in `CategoryPanel` and `MobileCategoryTabs` is driven by it.
- **Download gating.** `canDownload` is `false` for free users; the Download
  button stays interactive but opens the buy-credits dialog instead of
  downloading (`handleDownload` short-circuits when `isFree`).
- **Credit balance + switch confirm.** The top bar shows a live credits chip.
  Switching into a **new** category opens `ConfirmDialog` showing the 5-credit
  cost and current balance (its old "don't ask again" opt-out was removed — every
  switch now spends credits). Switching back to a paid category skips the prompt;
  if the balance can't cover a new category, the buy-credits dialog opens
  instead.
- **Buy-credits dialog.** `UpgradeDialog` (`components/UpgradeDialog.tsx`) lists
  the benefits and the three packs; each pack button calls
  `POST /api/stripe/checkout` and opens Stripe Checkout in a new tab. It appears
  for free users `UPSELL_DELAY_MS` (90s) after entering the page, immediately
  when they click the blocked Download, and whenever a category can't be paid
  for. The settings page reuses the same dialog and shows the balance.

## Stripe checkout & webhook

```text
POST /api/stripe/checkout   body { pack }  -> Checkout Session (mode: payment)
  resolves credits + price id server-side from CREDIT_PACKS (+ STRIPE_PRICE_*),
  stamps metadata { userId, pack, credits }; returns { url }
POST /api/stripe/webhook    verifies stripe-signature with STRIPE_WEBHOOK_SECRET
  on checkout.session.completed -> creditsService.grantPurchase(userId, pack)
    userRepository.addCredits(userId, pack.credits, 'top-up')
```

Checkout opens in a new tab so the in-progress build is preserved; the workspace
(and settings page) refresh the balance on window `focus` when the user returns.
The Stripe client (`src/server/infrastructure/stripe/stripe.ts`) reads
`STRIPE_SECRET_KEY` (falling back to `PROD_STRIPE_KEY`).

## Assigning a plan

A purchase upgrades the buyer to `top-up` automatically. To grant `top-up` or
credits while testing without paying:

```sql
UPDATE users SET plan_mode = 'top-up', credits = 100 WHERE email = 'you@example.com';
```

or use `npm run db:studio`. The change takes effect on the next options request.

## Environment

| Variable | Purpose | Default |
| --- | --- | --- |
| `DATABASE_URL` | Postgres connection string used by Drizzle (Neon/Supabase/Vercel PG) | — (required) |
| `STRIPE_SECRET_KEY` | Stripe server SDK key (falls back to `PROD_STRIPE_KEY`) | — (required for checkout) |
| `STRIPE_WEBHOOK_SECRET` | Verifies `checkout.session.completed` (`whsec_…`) | — (required for webhook) |
| `STRIPE_PRICE_P60` / `STRIPE_PRICE_P120` / `STRIPE_PRICE_P240` | Live Stripe price ids for the 3 packs | — (required for checkout) |
| `NEXT_PUBLIC_APP_URL` | Base URL for Stripe success/cancel redirects | request origin |
