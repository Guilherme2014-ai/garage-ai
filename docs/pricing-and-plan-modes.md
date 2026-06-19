# Pricing & Plan Modes

The first slice of pricing logic. Every user belongs to a **plan mode** that
gates what the customization flow gives them. This document covers the plan
model, the database that now backs users, and how the gate is enforced on the
backend and surfaced in the UI.

For the rest of the customization feature, see
[`customization-backend.md`](./customization-backend.md) (server) and
[`customization-logic.md`](./customization-logic.md) (frontend).

## Plan modes

Two modes for now (billing is **not** wired up yet):

| Plan | Categories | Options / category | Download |
| --- | --- | --- | --- |
| `free` | 3 | 5 | blocked (shows upsell) |
| `top-up` | all requested | 12 | allowed |

New users default to `free`. Until a billing/admin flow exists, a user becomes
`top-up` by setting their `plan_mode` column directly (see
[Assigning a plan](#assigning-a-plan)).

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
  free:     { maxCategories: 3,        optionsPerCategory: 5,  canDownload: false },
  "top-up": { maxCategories: Infinity, optionsPerCategory: 12, canDownload: true  },
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
  button stays interactive but opens the upsell instead of downloading
  (`handleDownload` short-circuits when `isFree`).
- **Upsell popup.** `UpgradeDialog` (`components/UpgradeDialog.tsx`) lists the
  benefits — more modifications, more equipment options, unlimited downloads —
  and appears for free users `UPSELL_DELAY_MS` (90s) after entering the page, or
  immediately when they click the blocked Download.

## Assigning a plan

There is no upgrade backend yet — the upsell CTA is a placeholder. To grant
`top-up` while testing:

```sql
UPDATE users SET plan_mode = 'top-up' WHERE email = 'you@example.com';
```

or use `npm run db:studio`. The change takes effect on the next options request.

## Environment

| Variable | Purpose | Default |
| --- | --- | --- |
| `DATABASE_URL` | Postgres connection string used by Drizzle (Neon/Supabase/Vercel PG) | — (required) |
