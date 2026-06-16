# Customization Logic

This document explains how the car customization flow works today, from the domain objects to the UI.

The implementation lives under `src/features/customize/` and is split into three layers:

- `core/customization-options/`: framework-independent customization logic.
- `hooks/useCustomization.ts`: React bridge for the core coordinator.
- `components/`: UI components for the customization workspace.

## Main Concepts

### CustomizationData

`CustomizationData` is the complete snapshot for the current build.

It contains:

- `selections`: the selected option slug per category.
- `categories`: generated option content for each category.
- `preview`: the generated vehicle preview for the current combination.

The current shape is defined in `types/CustomizationData.ts`:

```ts
type CustomizationData = {
  selections: CombinationSelections;
  categories: Record<CustomizationCategory, CustomizationCategoryContent>;
  preview: GeneratedPreview;
};
```

Each category has a generation status:

- `not-generated`: content has not been requested yet.
- `generating`: a mocked generation request is in progress.
- `generated`: content is ready and can be reused.

### Combination String

A combination is represented by the selected option per category.

Example:

```ts
{
  wheels: "rays",
  paint: "midnight",
}
```

The app serializes this into a stable combination string:

```text
paint__midnight|wheels__rays
```

The string is stable because entries are sorted before joining. That makes it safe to use as a cache key even if object key order changes.

The helpers are:

- `buildCombinationString()`
- `parseCombinationString()`

### CombinationTracker

`CombinationTracker` acts like a small version-control history for customization states.

It stores:

- an ordered `history` of combination strings.
- a `currentIndex` pointer to the active combination.

It supports:

- `push()`: commit a new combination.
- `back()`: move to the previous combination.
- `forward()`: move to the next combination.
- `restore()`: jump to an existing combination by string.
- `getHistory()`: expose the ordered history for the UI.

When `push()` is called from an older history position, forward history is discarded. This mirrors version-control behavior: making a new change after going back creates a new branch of history.

### CombinationsStringCache

`CombinationsStringCache` stores generated `CustomizationData` snapshots by combination string.

Its job is to avoid expensive generation when the user returns to a combination that already exists.

Flow:

1. User selects an option.
2. The new selections are converted to a combination string.
3. The cache is checked.
4. If a snapshot exists, it is restored immediately.
5. If not, the preview is generated and the resulting snapshot is cached.

## Coordinator Flow

`CustomizationDataCoordinator` is the central orchestrator.

It owns:

- `CombinationTracker`
- `CombinationsStringCache`
- the active `CustomizationData`
- a small subscription system used by React

The UI does not manipulate the tracker or cache directly. It calls coordinator methods.

### Initialization

The React hook creates a coordinator with `createInitialCustomizationData()`.

The initial state is the stock vehicle:

- no selections
- category content marked as `not-generated`
- base preview marked as `generated`

The coordinator immediately commits and caches the base combination (`""`).

### Entering A Category

When the user opens a category, `enterCategory(category)` runs.

If the category content is already generated, nothing else happens.

If it is not generated:

1. The category is set to `generating`.
2. `generateCategoryContent()` is called.
3. The returned options are stored in `CustomizationData.categories`.
4. The current snapshot is cached.

This is lazy generation: categories are only generated when the user visits them.

### Selecting An Option

When the user selects an option, `selectOption(category, slug)` runs.

Flow:

1. Build the next `selections` object.
2. Serialize it into a combination string.
3. If it matches the current combination, exit early.
4. Push the new combination into `CombinationTracker`.
5. Check `CombinationsStringCache`.
6. If cached, restore the cached snapshot instantly.
7. If not cached:
   - mark `preview` as `generating`
   - call `generateCombinationPreview()`
   - store the generated preview
   - cache the full snapshot

This is where the system models incremental image editing. A new selection represents a new vehicle state, and the preview generation represents applying the latest modification on top of the existing build.

### Leaving A Category

When the user switches category or saves the build, `leaveCategory(category)` runs.

It acts as a checkpoint:

1. Commit the current selections to the tracker.
2. Store the current snapshot in the cache.
3. Call `persistSnapshot()`.
4. Notify subscribers.

`persistSnapshot()` is currently a mocked no-op. It is the future integration point for backend persistence.

### Restoring History

The UI can restore a previous combination through:

- `goBack()`
- `goForward()`
- `restore(combinationString)`
- `reset()`

Restore flow:

1. Move the tracker pointer.
2. Build or receive the target combination string.
3. Look up the snapshot in `CombinationsStringCache`.
4. Restore the cached snapshot.

If a snapshot is missing, the coordinator falls back to restoring selections only. This should not happen during the normal flow, because generated combinations are cached as they are created.

## Mock Generation

Mock generation lives in `generation/mockGeneration.ts`.

There are two mocked calls:

- `generateCategoryContent(category, selections)`
- `generateCombinationPreview(selections)`

Both simulate latency with `setTimeout` and return static data from the local catalog.

These are the planned replacement points for real AI work:

- `generateCategoryContent()` can become the category option generation pipeline.
- `generateCombinationPreview()` can become the image editing pipeline that applies the latest modification to the current vehicle state.

## React Hook

`useCustomization()` is the React bridge.

It:

- creates one coordinator instance with `useRef`.
- mirrors coordinator data into React state.
- subscribes to coordinator updates.
- enters the first category on mount.
- exposes UI actions such as `selectCategory`, `selectOption`, `goBack`, `goForward`, `restore`, `reset`, and `save`.

The hook keeps the UI simple. Components receive plain data and callbacks instead of knowing about the tracker/cache internals.

## UI Flow

The `/customize` route renders `CustomizeWorkspace`.

The main UI pieces are:

- `CategoryPanel`: category navigation, generation status, selected option summaries, save/reset buttons.
- `PreviewStage`: generated preview area, loading overlay, undo/redo buttons, and version history.
- `OptionsPanel`: active category options, loading skeletons, option selection.

UI state comes from `useCustomization()`.

User actions flow down into the coordinator:

```text
User action
  -> component callback
  -> useCustomization()
  -> CustomizationDataCoordinator
  -> tracker/cache/generation
  -> coordinator notifies subscribers
  -> React state updates
  -> UI re-renders
```

## Important Design Decisions

### Category Options Are Lazy

The app does not generate all categories upfront. A category is generated only when it is opened.

This keeps startup fast and avoids paying generation cost for categories the user never visits.

### Generated Snapshots Are Cached

Combination previews are expensive, so generated snapshots are cached by combination string.

Returning to a known combination restores the cached `CustomizationData` instantly.

### Category Catalogs Are Reused Across Snapshots

Category catalogs are treated as combination-independent in the current mock implementation.

When a cached snapshot is restored, the coordinator merges in any already-generated category catalogs from the current session. This avoids unnecessary category regeneration when navigating history.

### The Coordinator Owns The Source Of Truth

The React hook mirrors state for rendering, but the coordinator owns the actual customization state and mutation rules.

This keeps the business logic testable and independent from React.

## Current Limitations

- AI generation is mocked.
- Snapshot persistence is a no-op.
- Cached data is in-memory only and resets on refresh.
- The generated preview is currently a stylized UI render, not a real generated image.
- There are no automated tests for the coordinator yet.

## Future Integration Points

Recommended next steps:

- Replace `generateCombinationPreview()` with the real AI image editing call.
- Replace `generateCategoryContent()` with the real category generation/catalog service if needed.
- Implement `persistSnapshot()` against a backend.
- Add tests for:
  - combination string serialization
  - tracker history behavior
  - cache restoration
  - category enter/leave checkpoint flow
  - coordinator restore/back/forward behavior
