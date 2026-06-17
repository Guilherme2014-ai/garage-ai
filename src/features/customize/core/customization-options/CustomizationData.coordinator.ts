import { CombinationTracker } from "./Combination.tracker";
import { CombinationsStringCache } from "./CombinationsStringCache";
import type {
  CombinationSelections,
  CustomizationCategory,
  CustomizationCategoryContent,
  CustomizationData,
} from "./types/CustomizationData";
import { buildCombinationString } from "./utils/buildCombinationString";
import { findOptionInData } from "./utils/findOptionInData";

type Listener = (data: CustomizationData) => void;

/**
 * Produces the new car image URL for the just-selected option, applied on top
 * of the current car state. Injected so the domain stays decoupled from the
 * backend transport.
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
 * Generation is performed lazily: category catalogs are generated when a
 * category is entered, and vehicle previews are generated when a selection
 * changes (unless a cached snapshot already exists).
 */
export class CustomizationDataCoordinator {
  private readonly tracker = new CombinationTracker<CustomizationCategory>();
  private readonly cache = new CombinationsStringCache();
  private data: CustomizationData;
  private listeners = new Set<Listener>();
  private readonly generatePreview: PreviewGenerator;

  constructor(initialData: CustomizationData, deps: CoordinatorDeps) {
    this.data = initialData;
    this.generatePreview = deps.generatePreview;
    this.tracker.push(initialData.selections);
    this.cache.set(this.currentCombinationString(), cloneData(initialData));
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
   * Entering a category. Catalogs are produced up-front from the LLM and stored
   * as `generated` in the initial data, so this is a no-op in the normal flow
   * and exists to keep the category-navigation contract intact.
   */
  public async enterCategory(category: CustomizationCategory): Promise<void> {
    if (this.data.categories[category].status !== "generated") {
      // Should not happen once initial data is built; keep the UI unblocked.
      this.setData(
        this.withCategory(category, {
          status: "generated",
          items: this.data.categories[category].items,
        }),
      );
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
   * Selecting an option creates a new combination. If that combination was
   * generated before, the cached snapshot is restored instantly; otherwise the
   * selected option is applied on top of the current car image via the injected
   * preview generator, and the new snapshot is cached.
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
    const currentImageUrl = this.data.preview.imageUrl;

    // Keep the current image visible beneath the generating overlay.
    this.setData({
      ...this.data,
      selections,
      preview: {
        status: "generating",
        combinationString,
        imageUrl: currentImageUrl,
        renderedAt: null,
      },
    });

    try {
      const imageUrl = await this.generatePreview({
        currentImageUrl,
        option: {
          name: option?.name ?? slug,
          visualDescription: option?.visualDescription ?? "",
        },
      });

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
    } catch (error) {
      console.error("Failed to generate preview:", error);
      // Revert to the previous image so the UI is not stuck generating.
      this.setData({
        ...this.data,
        preview: {
          status: "generated",
          combinationString,
          imageUrl: currentImageUrl,
          renderedAt: Date.now(),
        },
      });
    }
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

  private withCategory(
    category: CustomizationCategory,
    content: CustomizationCategoryContent,
  ): CustomizationData {
    return {
      ...this.data,
      categories: { ...this.data.categories, [category]: content },
    };
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
