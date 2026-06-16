export { CustomizeWorkspace } from "./components/CustomizeWorkspace";
export {
  CATEGORY_META,
  CATEGORY_ORDER,
  createInitialCustomizationData,
  findOption,
  OPTION_CATALOG,
} from "./core/customization-options/catalog";
export { CombinationsStringCache } from "./core/customization-options/CombinationsStringCache";
export { CombinationTracker } from "./core/customization-options/Combination.tracker";
export { CustomizationDataCoordinator } from "./core/customization-options/CustomizationData.coordinator";
export {
  CustomizationCategory,
  type CombinationSelections,
  type CustomizationCategoryContent,
  type CustomizationCategoryItem,
  type CustomizationData,
  type GeneratedPreview,
  type GenerationStatus,
} from "./core/customization-options/types/CustomizationData";
export { useCustomization } from "./hooks/useCustomization";
