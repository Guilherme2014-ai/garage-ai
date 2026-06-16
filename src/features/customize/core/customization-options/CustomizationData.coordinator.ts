import { CombinationsStringCache } from "./CombinationsStringCache";
import { CombinationTracker } from "./Combination.tracker";
import {
  generateCategoryContent,
  generateCombinationPreview,
} from "./generation/mockGeneration";
import type {
  CombinationSelections,
  CustomizationCategory,
  CustomizationCategoryContent,
  CustomizationData,
} from "./types/CustomizationData";
import { buildCombinationString } from "./utils/buildCombinationString";

type Listener = (data: CustomizationData) => void;

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

  constructor(initialData: CustomizationData) {
    this.data = initialData;
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
   * Entering a category: display its content if already generated, otherwise
   * generate it and store it in the current {@link CustomizationData}.
   */
  public async enterCategory(category: CustomizationCategory): Promise<void> {
    if (this.data.categories[category].status === "generated") {
      return;
    }

    this.setData(this.withCategory(category, { status: "generating", items: [] }));

    const content = await generateCategoryContent(category, this.data.selections);
    this.setData(this.withCategory(category, content));
    this.cache.set(this.currentCombinationString(), cloneData(this.data));
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
   * generated before, the cached snapshot is restored instantly; otherwise a
   * new preview is generated and cached.
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

    this.setData({
      ...this.data,
      selections,
      preview: {
        status: "generating",
        combinationString,
        imageUrl: null,
        renderedAt: null,
      },
    });

    const preview = await generateCombinationPreview(selections);
    this.setData({ ...this.data, preview });
    this.cache.set(combinationString, cloneData(this.data));
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
  private mergeGeneratedCatalogs(snapshot: CustomizationData): CustomizationData {
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
