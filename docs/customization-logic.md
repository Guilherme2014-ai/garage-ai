# Customization Logic (Frontend)

This document explains how the car customization flow works today, from the
domain objects to the UI. For the server side (API routes, AI providers, prompts,
storage), see [`customization-backend.md`](./customization-backend.md).

The implementation lives under `src/features/customize/` and is split into:

- `api/customizeApi.ts`: thin client wrappers around the backend routes.
- `core/customization-options/`: framework-independent customization logic.
- `hooks/useCustomization.ts`: React bridge for the core coordinator.
- `components/`: UI components for the intake form and customization workspace.

## End-to-End Flow

```text
Home (/) "Upload & Start Customizing"
  -> /customize  ->  CustomizeFlow
       1. CarIntakeForm: user provides car name/model + uploads a photo
       2. uploadCarImage()        -> POST /api/customize/upload  -> base image URL
       3. fetchCustomizationOptions() -> POST /api/customize/options -> LLM options
       4. buildInitialDataFromOptions(options, baseImageUrl) -> CustomizationData
       5. CustomizeWorkspace renders with that initial data
```

`CustomizeFlow` (`components/CustomizeFlow.tsx`) holds the gate: it shows
`CarIntakeForm` until the initial data is ready, then swaps in
`CustomizeWorkspace`.

The categories requested from the LLM are exactly `CATEGORY_ORDER` (the six
`CustomizationCategory` values), so the whole UI stays driven by that enum.

## Main Concepts

### CustomizationData

`CustomizationData` is the complete snapshot for the current build.

It contains:

- `selections`: the selected option slug per category.
- `categories`: the available options per category (each option can carry its own
  generated preview image).
- `preview`: the committed vehicle preview for the current combination.

```ts
type CustomizationData = {
  selections: CombinationSelections;
  categories: Record<CustomizationCategory, CustomizationCategoryContent>;
  preview: GeneratedPreview;
};

type CustomizationCategoryItem = {
  slug: string;
  name: string;
  description: string;
  price: number;
  swatch: string;
  /** Visual description sent to the edit route to build the prompt. */
  visualDescription?: string;
  /** The car image with THIS option applied (per-option preview). */
  preview?: ItemPreview;
};

type ItemPreview = {
  status: GenerationStatus; // "not-generated" | "generating" | "generated"
  imageUrl: string | null;
};
```

The key addition versus earlier versions is `ItemPreview`: every option holds its
own preview image, generated up-front when its category is opened.

### Building the Initial Data

`generation/buildInitialData.ts#buildInitialDataFromOptions()` maps the LLM
`/api/customize/options` response into `CustomizationData`:

- Every category is marked `generated` immediately (a single LLM call produced
  all of them).
- Each LLM option becomes a `CustomizationCategoryItem`:
  - `slug`: slugified name (de-duplicated with an index suffix).
  - `description`: `"{brand} · {description}"`.
  - `price`: the LLM estimate (or `0`).
  - `swatch`: the option's `colorHex`, else a deterministic color hashed from the
    name (keeps the UI colorful when no real color applies).
  - `visualDescription`: carried through for prompt building.
- `preview.imageUrl` starts at the user's uploaded photo (the base build).

### Combination String

A combination is the selected option per category, serialized into a stable,
order-independent string used as a cache key:

```ts
{ wheels: "te37", paint: "midnight" }  ->  "paint__midnight|wheels__te37"
```

Entries are sorted before joining, so the string is stable regardless of object
key order. Helpers: `buildCombinationString()` / `parseCombinationString()`.

### CombinationTracker

`CombinationTracker` is a small version-control history of combination strings:

- ordered `history` + a `currentIndex` pointer.
- `push()`, `back()`, `forward()`, `restore()`, `getHistory()`.

Pushing from an older position discards forward history, mirroring a
version-control branch.

### Caches

The coordinator keeps three in-memory caches (all reset on refresh):

- `CombinationsStringCache`: full `CustomizationData` snapshots keyed by
  combination string. Restoring a known combination is instant.
- `previewImageCache` (`Map<combinationString, imageUrl>`): the generated car
  image for a specific combination, so any given option image is generated only
  once and reused across categories and history.
- `categoryPreviewBase` (`Map<category, baseString>`): the base combination each
  category's option previews were last generated against, used to skip redundant
  regeneration.

## Coordinator Flow

`CustomizationDataCoordinator` is the central orchestrator. It owns the tracker,
the caches, the active `CustomizationData`, and a subscription system for React.
The UI never touches the tracker/cache directly — it calls coordinator methods.

The preview generator is **injected** (`CoordinatorDeps.generatePreview`) so the
domain stays decoupled from the backend transport. `useCustomization` wires it to
`editCarImage()` → `POST /api/customize/edit`.

```ts
type PreviewGenerator = (params: {
  currentImageUrl: string | null;
  option: { name: string; visualDescription: string };
}) => Promise<string>; // returns the new image URL
```

### Base Image

The central idea: each option preview shows that option applied on top of the
category's **base image** — the current build *without this category's own
selection*. `resolveBaseImage()` finds it from `previewImageCache`, then the
snapshot cache, then the initial image (for the stock base) or current image.

This means switching options within a category always layers on the same base,
instead of stacking option-on-option within the category.

### Entering a Category (per-option preview generation)

`enterCategory(category)` is where the heavy lifting happens:

1. Compute `baseSelections` (current selections minus this category) and its
   `baseString`; resolve the `baseImage`.
2. If previews for this category were already generated against the same
   `baseString` and all are `generated`, do nothing.
3. Seed each option's `preview`: reuse a `previewImageCache` hit instantly
   (`generated`); otherwise mark it `generating` and collect it as pending.
4. Generate the pending previews in parallel via `runWithConcurrency(...,
   PREVIEW_CONCURRENCY = 6, ...)`. Each result is written to
   `previewImageCache` and onto the option's `preview`.
5. If a generated option happens to be the option the user has already selected
   (still waiting on its main image), `fillPendingMainPreview()` commits it.

`PREVIEW_CONCURRENCY` is only a client-side fan-out ceiling; the authoritative
limit is enforced server-side (see the backend doc's concurrency section).

### Selecting an Option

`selectOption(category, slug)` does **not** generate anything — previews already
exist (or are in flight) from `enterCategory`:

1. Build the next `selections` and its combination string; exit early if
   unchanged.
2. Push the combination onto the tracker.
3. If a full snapshot is cached, restore it instantly.
4. Otherwise read the option's `preview`:
   - if `generated`, commit its image as the main `preview`, cache the snapshot.
   - if still `generating`, set the main preview to `generating` (showing the
     previous image) — `fillPendingMainPreview()` commits it once it resolves.

### Leaving a Category

`leaveCategory(category)` is a checkpoint: push the combination onto the tracker,
cache the snapshot, call `persistSnapshot()` (currently a no-op — the backend
persistence integration point), and notify subscribers.

### History Restore

`goBack()` / `goForward()` / `restore(string)` / `reset()` move the tracker
pointer and restore the cached snapshot. Because the base image changes when you
move through history, `useCustomization` re-runs `enterCategory(activeCategory)`
after each navigation so the visible category's option previews are regenerated
against the restored build.

## React Hook

`useCustomization({ initialData })`:

- creates one coordinator instance (`useRef`), injecting the
  `editCarImage`-backed preview generator.
- mirrors coordinator data and nav state into React state via `subscribe`.
- on mount, sets the first category active and calls `enterCategory` to populate
  its previews.
- exposes `selectCategory`, `selectOption`, `goBack`, `goForward`, `restore`,
  `reset`, `save`, plus `data`, `activeCategory`, `nav`, and `isSaved`.

## UI Flow

`/customize` renders `CustomizeFlow`, which renders either:

- `CarIntakeForm`: car name input + photo upload, with `uploading` /
  `generating` progress and error states.
- `CustomizeWorkspace`: the editor, composed of
  - `CategoryPanel`: category nav, selected-option summaries, save/reset. Option
    lookups use `findOptionInData()` (live LLM items, not the static catalog).
  - `PreviewStage`: the committed main preview image (`data.preview.imageUrl`),
    generating overlay, undo/redo, and version history (swatches resolved from
    live data).
  - `OptionsPanel`: option cards, each showing its own preview image (or a
    stylized fallback + spinner while generating) and a `ready/total` counter.

```text
User action -> component callback -> useCustomization()
  -> CustomizationDataCoordinator -> tracker/caches/generatePreview
  -> coordinator notifies subscribers -> React state -> UI re-renders
```

## Important Design Decisions

- **Options come from one LLM call.** All categories are generated up-front and
  marked `generated`; the UI does not lazily fetch catalogs per category anymore.
- **Previews are per-option and generated per category.** Opening a category
  fans out one image edit per option (bounded concurrency), so each card is a
  real "what your car would look like" preview.
- **Everything cacheable is cached by combination string.** Option images
  (`previewImageCache`) and full snapshots (`CombinationsStringCache`) are reused
  across categories and history navigation.
- **The coordinator owns the source of truth.** React only mirrors it, keeping
  the domain logic testable and framework-independent.
- **Option lookups are data-driven.** `findOptionInData()` reads the live
  session items; the static `OPTION_CATALOG` is no longer the source for the
  active build.

## Current Limitations

- Snapshot persistence (`persistSnapshot()`) is still a no-op.
- All caches are in-memory and reset on refresh.
- Combination caching is order-independent, but AI edits are order-sensitive: the
  first image generated for a given combination is reused even if a different
  application order might look slightly different.
- No automated tests for the coordinator yet (good candidates: combination string
  serialization, tracker history, cache/preview reuse, enter/leave checkpoints,
  restore/back/forward).
