import { buildCombinationString } from "./utils/buildCombinationString";
import { parseCombinationString } from "./utils/parseCombinationString";

export class CombinationTracker<K extends string> {
  private combinations: Set<string> = new Set();

  public addCombination(combination: Record<K, string>) {
    this.combinations.add(buildCombinationString(combination));
  }

  public removeLastCombination(): Record<K, string> {
    const lastCombination = this.getLastCombination();
    this.combinations.delete(buildCombinationString(lastCombination));
    return lastCombination;
  }

  public getLastCombination(): Record<K, string> {
    const lastCombination = Array.from(this.combinations).at(-1);
    if (!lastCombination) {
      return {} as Record<K, string>;
    }

    return parseCombinationString<K>(lastCombination);
  }

  public getCombinationList(): string[] {
    return Array.from(this.combinations);
  }
}
