import type { CustomizationData } from "./types/CustomizationData";

/**
 * Stores previously generated {@link CustomizationData} snapshots keyed by their
 * combination string.
 *
 * Generating previews is expensive, so when a user returns to a known
 * combination the cached snapshot is restored instead of regenerating it.
 */
export class CombinationsStringCache {
  private cache = new Map<string, CustomizationData>();

  public has(combinationString: string): boolean {
    return this.cache.has(combinationString);
  }

  public get(combinationString: string): CustomizationData | undefined {
    return this.cache.get(combinationString);
  }

  public set(combinationString: string, data: CustomizationData): void {
    this.cache.set(combinationString, data);
  }

  public delete(combinationString: string): void {
    this.cache.delete(combinationString);
  }

  public clear(): void {
    this.cache.clear();
  }

  public get size(): number {
    return this.cache.size;
  }

  /** Plain-object view of every cached snapshot, for persistence. */
  public toRecord(): Record<string, CustomizationData> {
    return Object.fromEntries(this.cache);
  }

  /** Replaces the cache contents from a previously serialized record. */
  public load(record: Record<string, CustomizationData>): void {
    this.cache = new Map(Object.entries(record));
  }
}
