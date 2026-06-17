import { CombinationTracker } from "./Combination.tracker";
import { CombinationsStringCache } from "./CombinationsStringCache";
import type {
  CombinationSelections,
  CustomizationCategory,
  CustomizationCategoryItem,
  CustomizationData,
  ItemPreview,
} from "./types/CustomizationData";
import { buildCombinationString } from "./utils/buildCombinationString";
import { findOptionInData } from "./utils/findOptionInData";

type Listener = (data: CustomizationData) => void;

/**
 * Produces the car image URL for an option, applied on top of a base car image.
 * Injected so the domain stays decoupled from the backend transport.
 */
export type PreviewGenerator = (params: {
  currentImageUrl: string | null;
  option: { name: string; visualDescription: string };
}) => Promise<string>;

export interface CoordinatorDeps {
  generatePreview: PreviewGenerator;
}

function cloneData(data: CustomizationData): CustomizationData {
  return structuredClone(data);
}

/**
 * Orchestrates the customization flow by tying together three concerns:
 *
 * - {@link CombinationTracker}: version-control history of combinations.
 * - {@link CombinationsStringCache}: cache of generated snapshots per combination.
 * - the active {@link CustomizationData}: the working state surfaced to the UI.
 *
 * Previews are generated at the category level: entering a category generates
 * the preview for every option sequentially, in display order (first to last),
 * each applied on top of the category's base image. Generating in order means
 * the previews the user sees first (the top of the list) are the first to load.
 * Selecting an option then commits its already-generated preview, and leaving
 * the category checkpoints the combination.
 */
export class CustomizationDataCoordinator {
  private readonly tracker = new CombinationTracker<CustomizationCategory>();
  private readonly cache = new CombinationsStringCache();
  private data: CustomizationData;
  private listeners = new Set<Listener>();
  private readonly generatePreview: PreviewGenerator;

  /** Per-combination image cache so an option image is generated only once. */
  private readonly previewImageCache = new Map<string, string>();
  /** Base combination string each category's previews were generated against. */
  private readonly categoryPreviewBase = new Map<
    CustomizationCategory,
    string
  >();
  private readonly initialImageUrl: string | null;

  constructor(initialData: CustomizationData, deps: CoordinatorDeps) {
    this.data = initialData;
    this.generatePreview = deps.generatePreview;
    this.initialImageUrl = initialData.preview.imageUrl;
    this.tracker.push(initialData.selections);

    const initialString = this.currentCombinationString();
    this.cache.set(initialString, cloneData(initialData));
    if (initialData.preview.imageUrl) {
      this.previewImageCache.set(initialString, initialData.preview.imageUrl);
    }
  }

  // --- subscription -------------------------------------------------------

  /** Subscribes to state changes. Returns an unsubscribe function. */
  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    for (const listener of this.listeners) {
      listener(this.data);
    }
  }

  private setData(data: CustomizationData): void {
    this.data = data;
    this.notify();
  }

  // --- reads --------------------------------------------------------------

  public getData(): CustomizationData {
    return this.data;
  }

  public getCurrentCombination(): CombinationSelections {
    return this.tracker.getCurrent();
  }

  public currentCombinationString(): string {
    return this.tracker.getCurrentString() ?? "";
  }

  public getHistory(): string[] {
    return this.tracker.getHistory();
  }

  public getCurrentIndex(): number {
    return this.tracker.getCurrentIndex();
  }

  public canGoBack(): boolean {
    return this.tracker.canGoBack();
  }

  public canGoForward(): boolean {
    return this.tracker.canGoForward();
  }

  // --- category lifecycle -------------------------------------------------

  /**
   * Entering a category generates the preview for every option sequentially, in
   * display order (first to last), each applied on top of the category's base
   * image (the current build without this category's own selection). Previews
   * already in the image cache are reused instantly; the rest are generated and
   * cached. Generating in order prioritizes the previews the user sees first.
   */
  public async enterCategory(category: CustomizationCategory): Promise<void> {
    const content = this.data.categories[category];
    if (!content || content.items.length === 0) {
      return;
    }

    const baseSelections = this.withoutCategory(this.data.selections, category);
    const baseString = buildCombinationString(baseSelections);
    const baseImage = this.resolveBaseImage(baseString);

    // Skip if previews are already generated against the same base image.
    if (
      this.categoryPreviewBase.get(category) === baseString &&
      content.items.every((item) => item.preview?.status === "generated")
    ) {
      return;
    }
    this.categoryPreviewBase.set(category, baseString);

    // Seed previews: reuse cached images instantly, mark the rest as pending.
    const pending: CustomizationCategoryItem[] = [];
    const seeded = content.items.map((item) => {
      const combinationString = buildCombinationString({
        ...baseSelections,
        [category]: item.slug,
      });
      const cachedImage = this.previewImageCache.get(combinationString);
      if (cachedImage) {
        const preview: ItemPreview = {
          status: "generated",
          imageUrl: cachedImage,
        };
        return { ...item, preview };
      }
      pending.push(item);
      const preview: ItemPreview = {
        status: baseImage ? "generating" : "generated",
        imageUrl: null,
      };
      return { ...item, preview };
    });
    this.setData(this.withCategoryItems(category, seeded));

    if (!baseImage || pending.length === 0) {
      return;
    }

    // Generate sequentially, in display order, so the first (top, most visible)
    // options load first instead of completing in an arbitrary order.
    for (const item of pending) {
      // The user may have moved to another category/base while we were
      // generating; stop so we don't keep producing stale previews.
      if (this.categoryPreviewBase.get(category) !== baseString) {
        return;
      }

      const combinationString = buildCombinationString({
        ...baseSelections,
        [category]: item.slug,
      });
      try {
        const imageUrl = await this.generatePreview({
          currentImageUrl: baseImage,
          option: {
            name: item.name,
            visualDescription: item.visualDescription ?? "",
          },
        });
        this.previewImageCache.set(combinationString, imageUrl);
        this.setItemPreview(category, item.slug, {
          status: "generated",
          imageUrl,
        });
        this.fillPendingMainPreview(combinationString, imageUrl);
      } catch (error) {
        console.error("Failed to generate option preview:", error);
        this.setItemPreview(category, item.slug, {
          status: "generated",
          imageUrl: null,
        });
      }
    }
  }

  /**
   * Leaving a category acts as a checkpoint: the current combination is
   * committed to the tracker, the cache is updated, and the snapshot is
   * persisted.
   */
  public async leaveCategory(_category: CustomizationCategory): Promise<void> {
    this.tracker.push(this.data.selections);
    this.cache.set(this.currentCombinationString(), cloneData(this.data));
    await this.persistSnapshot();
    this.notify();
  }

  // --- selection ----------------------------------------------------------

  /**
   * Selecting an option creates a new combination and commits the option's
   * already-generated preview as the current build. No generation happens here:
   * previews are produced at the category level when the category is entered.
   * If the option's preview is still generating, it is filled in on completion.
   */
  public async selectOption(
    category: CustomizationCategory,
    slug: string,
  ): Promise<void> {
    const selections: CombinationSelections = {
      ...this.data.selections,
      [category]: slug,
    };
    const combinationString = buildCombinationString(selections);

    if (combinationString === this.currentCombinationString()) {
      return;
    }

    this.tracker.push(selections);

    const cached = this.cache.get(combinationString);
    if (cached) {
      this.setData(this.mergeGeneratedCatalogs(cloneData(cached)));
      return;
    }

    const option = findOptionInData(this.data, category, slug);
    const fallbackImage = this.data.preview.imageUrl;
    const optionPreview = option?.preview;

    if (optionPreview?.status === "generated") {
      const imageUrl = optionPreview.imageUrl ?? fallbackImage;
      if (imageUrl) {
        this.previewImageCache.set(combinationString, imageUrl);
      }
      this.setData({
        ...this.data,
        selections,
        preview: {
          status: "generated",
          combinationString,
          imageUrl,
          renderedAt: Date.now(),
        },
      });
      this.cache.set(combinationString, cloneData(this.data));
      return;
    }

    // The option's preview is still generating at the category level. Show the
    // generating state; `fillPendingMainPreview` commits it once it resolves.
    this.setData({
      ...this.data,
      selections,
      preview: {
        status: "generating",
        combinationString,
        imageUrl: fallbackImage,
        renderedAt: null,
      },
    });
  }

  // --- navigation ---------------------------------------------------------

  public goBack(): void {
    const combination = this.tracker.back();
    if (combination) {
      this.restoreCombination(combination);
    }
  }

  public goForward(): void {
    const combination = this.tracker.forward();
    if (combination) {
      this.restoreCombination(combination);
    }
  }

  /** Restores an existing combination by its serialized string. */
  public restore(combinationString: string): void {
    const combination = this.tracker.restore(combinationString);
    if (combination) {
      this.restoreCombination(combination);
    }
  }

  /** Clears all selections by returning to the stock (base) combination. */
  public reset(): void {
    const base = this.tracker.restore("");
    if (base) {
      this.restoreCombination(base);
    }
  }

  // --- internals ----------------------------------------------------------

  private restoreCombination(combination: CombinationSelections): void {
    const combinationString = buildCombinationString(combination);
    const cached = this.cache.get(combinationString);

    if (cached) {
      this.setData(this.mergeGeneratedCatalogs(cloneData(cached)));
      return;
    }

    // Fallback: the snapshot is missing (should not happen in normal flow).
    this.setData({ ...this.data, selections: combination });
  }

  /** Returns a copy of the selections with the given category removed. */
  private withoutCategory(
    selections: CombinationSelections,
    category: CustomizationCategory,
  ): CombinationSelections {
    const next = { ...selections };
    delete next[category];
    return next;
  }

  /**
   * The image the category's option previews are layered on top of: the build
   * without this category's selection. Resolved from the per-combination image
   * cache, falling back to a cached snapshot, the initial image, or the current
   * image.
   */
  private resolveBaseImage(baseString: string): string | null {
    return (
      this.previewImageCache.get(baseString) ??
      this.cache.get(baseString)?.preview.imageUrl ??
      (baseString === "" ? this.initialImageUrl : this.data.preview.imageUrl) ??
      null
    );
  }

  private withCategoryItems(
    category: CustomizationCategory,
    items: CustomizationCategoryItem[],
  ): CustomizationData {
    return {
      ...this.data,
      categories: {
        ...this.data.categories,
        [category]: { ...this.data.categories[category], items },
      },
    };
  }

  private setItemPreview(
    category: CustomizationCategory,
    slug: string,
    preview: ItemPreview,
  ): void {
    const items = this.data.categories[category].items.map((item) =>
      item.slug === slug ? { ...item, preview } : item,
    );
    this.setData(this.withCategoryItems(category, items));
  }

  /**
   * When an option preview finishes generating and that option is the active
   * (just-selected) combination still waiting on its image, commit it.
   */
  private fillPendingMainPreview(
    combinationString: string,
    imageUrl: string,
  ): void {
    if (
      this.currentCombinationString() === combinationString &&
      this.data.preview.status === "generating"
    ) {
      this.setData({
        ...this.data,
        preview: {
          status: "generated",
          combinationString,
          imageUrl,
          renderedAt: Date.now(),
        },
      });
      this.cache.set(combinationString, cloneData(this.data));
    }
  }

  /**
   * Category catalogs are combination-independent, so a snapshot restored from
   * the cache reuses any catalog already generated in the current session
   * instead of forcing a regeneration.
   */
  private mergeGeneratedCatalogs(
    snapshot: CustomizationData,
  ): CustomizationData {
    const categories = { ...snapshot.categories };

    for (const key of Object.keys(this.data.categories) as Array<
      keyof typeof categories
    >) {
      if (
        this.data.categories[key].status === "generated" &&
        categories[key].status !== "generated"
      ) {
        categories[key] = this.data.categories[key];
      }
    }

    return { ...snapshot, categories };
  }

  /**
   * MOCK: persists the current snapshot. In production this would write to a
   * backend; here it is a no-op kept as an explicit checkpoint step.
   *
   * TODO: persist the snapshot to the backend.
   */
  private async persistSnapshot(): Promise<void> {
    return Promise.resolve();
  }
}
