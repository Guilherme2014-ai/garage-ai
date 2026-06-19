# Garage AI Docs

Documentation for the car customization feature.

## Contents

- [Customization Logic (Frontend)](./customization-logic.md) — the browser-side
  domain model and flow: `CustomizationData`, the coordinator, combination
  tracking/caching, per-option preview generation, the React hook, and the UI.
- [Customization Backend (API + AI)](./customization-backend.md) — the server
  side: API routes, application services, WaveSpeed (LLM + image edit) providers,
  prompt building, Vercel Blob storage, the concurrency gate, and environment
  variables.
- [Pricing & Plan Modes](./pricing-and-plan-modes.md) — plan modes (`free` /
  `top-up`) and the privileges they gate, the Drizzle/Postgres `users` database,
  backend plan gating, and the download/upsell behavior in the UI.

## Feature at a glance

```text
Home -> /customize
  Intake: upload car photo + name        -> POST /api/customize/upload
  Generate options (one LLM call)        -> POST /api/customize/options
  Build initial CustomizationData
  Workspace:
    Enter a category -> generate a preview image per option (bounded concurrency)
                                           -> POST /api/customize/edit (per option)
    Select an option -> commit its preview as the current car state
    Undo / redo / restore across the version history
```

Code lives under `src/features/customize/` (frontend) and
`src/server/` + `src/app/api/customize/` (backend).
