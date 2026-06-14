import { CombinationTracker } from "./Combination.tracker";
import { CustomizationCategory, CustomizationData } from "./types/CustomizationData";
import { buildCombinationString } from "./utils/buildCombinationString";

export class CustomizationDataCoordinator {
    private combinationTracker: CombinationTracker<CustomizationCategory>;
    private combinationsStringCache: Record<string, CustomizationData> = {};

  constructor() {
    this.combinationTracker = new CombinationTracker<CustomizationCategory>();
  }
  
  public saveData(data: CustomizationData) {
    // this.combinationTracker.addCombination(data);
    const currCombination = this.combinationTracker.getLastCombination();
    const currCombinationString = buildCombinationString(currCombination);

    this.combinationsStringCache[currCombinationString] = data;
  }
}