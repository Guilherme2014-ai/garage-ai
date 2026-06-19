# Builds (Saving the Customization Session)

A **build** is a persisted customization session. It captures everything the
[`CustomizationDataCoordinator`](./customization-logic.md#coordinator-flow)
owns so a session can be resumed exactly: the current state, the version-control
history, and every cache. This is what makes "Save Build" real and lets a user
return to the same session after a reload or a Stripe checkout.

For the in-browser domain model see
[`customization-logic.md`](./customization-logic.md); for the rest of the
backend see [`customization-backend.md`](./customization-backend.md).

## What a build contains

The serialized session is a `BuildSnapshot`
(`core/customization-options/types/BuildSnapshot.ts`). Each coordinator concern
is abstracted into its own field rather than dumped as one opaque object:

```ts
type BuildSnapshot = {
  version: number;                          // format version
  data: CustomizationData;                  // the working state (current)
  initialImageUrl: string | null;           // the stock base image
  tracker: { history: string[]; currentIndex: number }; // undo/redo history
  snapshots: Record<string, CustomizationData>;         // CombinationsStringCache
  previewImages: Record<string, string>;                // per-combination image cache
  categoryPreviewBase: Partial<Record<Category, string>>;
  paidCategories: Category[];               // categories already charged for
};
```

- `serialize()` exports this from the coordinator; `fromSnapshot()` /
  the snapshot constructor rehydrate a coordinator from it.
- `CombinationTracker.toSnapshot()/restoreSnapshot()` and
  `CombinationsStringCache.toRecord()/load()` own their own
  serialization, so the coordinator just composes them.
- The coordinator stays persistence-agnostic — it only knows how to
  `serialize()`/hydrate. Saving is driven entirely from the React layer.

## Persistence (server)

Builds follow the same `route → service → repository` flow as the rest of the
backend. `state` is stored as opaque `jsonb` (the shape is owned by the client
`BuildSnapshot`), so the domain can evolve without a schema migration.

```text
src/server/infrastructure/database/schema.ts   builds table (FK user_id, cascade)
src/server/repositories/build.repository.ts     CRUD, scoped to the owner
src/server/application/services/builds/          validation + ownership
src/app/api/builds/route.ts                      POST (create), GET (list)
src/app/api/builds/[id]/route.ts                 GET, PUT (save), DELETE
```

Every read/write is scoped to the signed-in user; a build the user doesn't own
is reported as `404` so existence isn't leaked.

### `builds` table

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid | PK, `defaultRandom()` |
| `user_id` | uuid | FK → `users.id`, `on delete cascade` |
| `car_name` | text | not null |
| `base_image_url` | text | the stock (uploaded) car photo |
| `state` | jsonb | the serialized `BuildSnapshot` |
| `created_at` / `updated_at` | timestamptz | `defaultNow()` |

## Lifecycle (client)

`useBuildPersistence` (`hooks/useBuildPersistence.ts`) wires the coordinator to
the backend; `useCustomization` composes it so the workspace sees one API.

```text
New session (intake):
  workspace mounts -> POST /api/builds (initial serialize) -> build id
    -> id pushed into the URL via history.replaceState  (/customize?build=<id>)
  any coordinator change -> debounced autosave -> PUT /api/builds/<id>
  "Save Build" button -> checkpoint + immediate flush
  tab hidden/closed -> best-effort flush

Resume (URL has ?build=<id>):
  page reads searchParams.build -> CustomizeFlow loads it:
    GET /api/builds/<id>  (snapshot) + GET /api/credits (balance + plan)
    -> coordinator.fromSnapshot(...) -> workspace, intake skipped
```

The id lives in the `?build=` URL param, so a reload or a redirect resumes the
same session. The URL is updated with `history.replaceState` (not a navigation)
so adopting the id never remounts the in-progress workspace.

### Paid categories persist with the build

Which categories have been charged (`CREDITS_PER_CATEGORY`) is tracked on the
coordinator and serialized into the snapshot. Reopening a build (refresh, or
returning from checkout) therefore never re-charges an already-paid category —
an improvement over the previous in-memory-only behavior.

## Checkout round-trip

Buying credits opens Stripe Checkout in a new tab with the current build id
threaded through:

```text
UpgradeDialog -> POST /api/stripe/checkout { pack, buildId }
  success_url/cancel_url = /customize?build=<id>&credits=success|cancelled
```

So after paying, the user lands back on the **same build session**. Credits are
refreshed on return three ways: the original tab refreshes on window `focus`,
the returning tab re-reads `/api/credits` on load, and `?credits=success`
triggers an explicit refresh (retried once, since the granting webhook can land
just after the redirect).

## Notes & trade-offs

- Autosave is debounced (~1.2s) and coalesces the burst of notifications a
  category's parallel preview generation produces into roughly one write.
- The whole snapshot (including the snapshot/image caches) is persisted, so a
  resumed build keeps instant history navigation and avoids regenerating
  previews it already has.
- The active category isn't persisted; a resumed build opens on the first
  category, though the committed car preview and selections are restored.
