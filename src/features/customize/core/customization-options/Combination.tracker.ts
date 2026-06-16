import { buildCombinationString } from "./utils/buildCombinationString";
import { parseCombinationString } from "./utils/parseCombinationString";

export type Combination<K extends string> = Partial<Record<K, string>>;

/**
 * Version-control-like history for vehicle customizations.
 *
 * Every modification creates a new combination on top of the current one.
 * The tracker keeps an ordered history and a pointer to the active combination,
 * enabling back/forward navigation and restoring any known combination.
 */
export class CombinationTracker<K extends string> {
  private history: string[] = [];
  private currentIndex = -1;

  /**
   * Commits a new combination as the latest version. Branching from a past
   * point discards any "forward" history, mirroring a version-control commit.
   * No-ops when the combination already matches the active one.
   */
  public push(combination: Combination<K>): void {
    const combinationString = buildCombinationString(combination);
    if (combinationString === this.getCurrentString()) {
      return;
    }

    this.history = this.history.slice(0, this.currentIndex + 1);
    this.history.push(combinationString);
    this.currentIndex = this.history.length - 1;
  }

  /** The currently active combination. */
  public getCurrent(): Combination<K> {
    const current = this.getCurrentString();
    return current ? parseCombinationString<K>(current) : {};
  }

  /** The serialized form of the active combination, or `null` when empty. */
  public getCurrentString(): string | null {
    return this.history[this.currentIndex] ?? null;
  }

  public canGoBack(): boolean {
    return this.currentIndex > 0;
  }

  public canGoForward(): boolean {
    return this.currentIndex < this.history.length - 1;
  }

  /** Moves the pointer to the previous combination, if any. */
  public back(): Combination<K> | null {
    if (!this.canGoBack()) {
      return null;
    }
    this.currentIndex -= 1;
    return this.getCurrent();
  }

  /** Moves the pointer to the next combination, if any. */
  public forward(): Combination<K> | null {
    if (!this.canGoForward()) {
      return null;
    }
    this.currentIndex += 1;
    return this.getCurrent();
  }

  /** Restores an existing combination by jumping the pointer to it. */
  public restore(combinationString: string): Combination<K> | null {
    const index = this.history.indexOf(combinationString);
    if (index === -1) {
      return null;
    }
    this.currentIndex = index;
    return this.getCurrent();
  }

  /** The full ordered history of combination strings. */
  public getHistory(): string[] {
    return [...this.history];
  }

  public getCurrentIndex(): number {
    return this.currentIndex;
  }
}
