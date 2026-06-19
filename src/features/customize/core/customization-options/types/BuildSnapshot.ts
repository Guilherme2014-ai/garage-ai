import type { TrackerSnapshot } from "../Combination.tracker";
import type {
  CustomizationCategory,
  CustomizationData,
} from "./CustomizationData";

/**
 * Serialization format version. Bumped when {@link BuildSnapshot} changes shape
 * in a way that older persisted blobs can't be read as-is.
 */
export const BUILD_SNAPSHOT_VERSION = 1;

/**
 * A fully serializable snapshot of a customization session — everything the
 * {@link import("../CustomizationData.coordinator").CustomizationDataCoordinator}
 * owns — so a saved build can be restored exactly: the live state, the
 * version-control history, and every cache.
 *
 * This is the payload persisted as a build's `state`. It deliberately mirrors
 * the coordinator's internals (each cache abstracted into its own field) rather
 * than dumping a single opaque object, so the persisted shape stays explicit.
 */
export type BuildSnapshot = {
  /** Format version (see {@link BUILD_SNAPSHOT_VERSION}). */
  version: number;
  /** The working {@link CustomizationData} surfaced to the UI. */
  data: CustomizationData;
  /** The stock (base) car image previews are layered on top of. */
  initialImageUrl: string | null;
  /** Version-control history of combination strings + pointer. */
  tracker: TrackerSnapshot;
  /** Full {@link CustomizationData} snapshots keyed by combination string. */
  snapshots: Record<string, CustomizationData>;
  /** Per-combination generated car image URLs (the image cache). */
  previewImages: Record<string, string>;
  /** Base combination each category's option previews were generated against. */
  categoryPreviewBase: Partial<Record<CustomizationCategory, string>>;
  /** Categories already charged for in this build (never charged again). */
  paidCategories: CustomizationCategory[];
};
