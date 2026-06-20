"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { chargeCategory } from "../api/creditsApi";
import { editCarImage } from "../api/customizeApi";
import { CustomizationDataCoordinator } from "../core/customization-options/CustomizationData.coordinator";
import { getActiveCategories } from "../core/customization-options/catalog";
import type { BuildSnapshot } from "../core/customization-options/types/BuildSnapshot";
import type {
  CustomizationCategory,
  CustomizationData,
} from "../core/customization-options/types/CustomizationData";
import { useBuildPersistence } from "./useBuildPersistence";

type NavState = {
  canGoBack: boolean;
  canGoForward: boolean;
  history: string[];
  currentString: string;
  currentIndex: number;
};

function readNav(coordinator: CustomizationDataCoordinator): NavState {
  return {
    canGoBack: coordinator.canGoBack(),
    canGoForward: coordinator.canGoForward(),
    history: coordinator.getHistory(),
    currentString: coordinator.currentCombinationString(),
    currentIndex: coordinator.getCurrentIndex(),
  };
}

/**
 * Bridges the {@link CustomizationDataCoordinator} domain logic to React.
 *
 * The coordinator owns the source of truth; the hook mirrors its state and
 * exposes the category-flow and version-control actions to the UI. Initial data
 * is built from the LLM options response (new session) or rehydrated from a
 * saved {@link BuildSnapshot}. Selecting an option drives a real AI edit of the
 * current car image via the customization edit route. Persistence (saving the
 * session as a build) is delegated to {@link useBuildPersistence}.
 */
export function useCustomization({
  initialData,
  initialSnapshot,
  initialBuildId,
  carName,
  baseImageUrl,
  initialCredits,
  onNeedCredits,
}: {
  initialData: CustomizationData;
  /** When resuming a saved build, its full serialized session. */
  initialSnapshot?: BuildSnapshot;
  /** When resuming a saved build, its id. */
  initialBuildId?: string;
  /** Car name, persisted with the build. */
  carName: string;
  /** The stock (uploaded) car image, persisted as the build's base. */
  baseImageUrl: string;
  /** The user's credit balance when the workspace mounted. */
  initialCredits: number;
  /** Called when a category can't be entered for lack of credits. */
  onNeedCredits: () => void;
}) {
  const coordinatorRef = useRef<CustomizationDataCoordinator | null>(null);
  if (coordinatorRef.current === null) {
    const deps = {
      generatePreview: async ({
        currentImageUrl,
        option,
      }: {
        currentImageUrl: string | null;
        option: { name: string; visualDescription: string };
      }) => {
        if (!currentImageUrl) {
          throw new Error("Missing current car image");
        }
        return editCarImage({
          imageUrl: currentImageUrl,
          name: option.name,
          visualDescription: option.visualDescription,
        });
      },
    };
    coordinatorRef.current = initialSnapshot
      ? CustomizationDataCoordinator.fromSnapshot(initialSnapshot, deps)
      : new CustomizationDataCoordinator(initialData, deps);
  }
  const coordinator = coordinatorRef.current;

  const [data, setData] = useState<CustomizationData>(() =>
    coordinator.getData(),
  );
  const [activeCategory, setActiveCategory] = useState<CustomizationCategory>(
    () => getActiveCategories(coordinator.getData())[0] ?? "",
  );
  const [nav, setNav] = useState<NavState>(() => readNav(coordinator));
  const [credits, setCredits] = useState(initialCredits);

  const { buildId, isSaved, isSaving, saveNow } = useBuildPersistence({
    coordinator,
    initialBuildId,
    carName,
    baseImageUrl,
  });

  /**
   * Charges 5 credits for first-time entry into a category. Returns whether the
   * category may be entered: `true` if already paid or the charge succeeded;
   * `false` (and triggers the buy-credits prompt) when the balance can't cover
   * it. Paid categories are tracked on the coordinator, so they persist with the
   * build — reopening it never re-charges an already-paid category.
   */
  const guardEnter = useCallback(
    async (category: CustomizationCategory): Promise<boolean> => {
      if (coordinator.isCategoryPaid(category)) {
        return true;
      }
      const result = await chargeCategory();
      if (result.ok) {
        coordinator.markCategoryPaid(category);
        setCredits(result.credits);
        return true;
      }
      if (result.insufficient) {
        onNeedCredits();
      }
      return false;
    },
    [coordinator, onNeedCredits],
  );

  useEffect(() => {
    const unsubscribe = coordinator.subscribe((next) => {
      setData(next);
      setNav(readNav(coordinator));
    });
    return unsubscribe;
  }, [coordinator]);

  // Force the first category to be active and generate its option previews
  // up-front (charging for it), so the user lands on a populated category. For a
  // resumed build the category is already paid and its previews cached, so this
  // neither re-charges nor regenerates.
  useEffect(() => {
    const first = getActiveCategories(coordinator.getData())[0];
    if (!first) {
      return;
    }
    setActiveCategory(first);
    void guardEnter(first).then((allowed) => {
      if (allowed) {
        void coordinator.enterCategory(first);
      }
    });
  }, [coordinator, guardEnter]);

  const selectCategory = useCallback(
    async (category: CustomizationCategory) => {
      if (category === activeCategory) {
        return;
      }
      // Charge for (or confirm prior payment of) the target before switching;
      // abort the switch entirely when it can't be paid.
      const allowed = await guardEnter(category);
      if (!allowed) {
        return;
      }
      coordinator.leaveCategory(activeCategory);
      setActiveCategory(category);
      await coordinator.enterCategory(category);
    },
    [activeCategory, coordinator, guardEnter],
  );

  const selectOption = useCallback(
    (category: CustomizationCategory, slug: string) => {
      void coordinator.selectOption(category, slug);
    },
    [coordinator],
  );

  // After navigating history the base image changes, so the active category's
  // option previews are regenerated against the restored build.
  const goBack = useCallback(() => {
    coordinator.goBack();
    void coordinator.enterCategory(activeCategory);
  }, [activeCategory, coordinator]);

  const goForward = useCallback(() => {
    coordinator.goForward();
    void coordinator.enterCategory(activeCategory);
  }, [activeCategory, coordinator]);

  const restore = useCallback(
    (combinationString: string) => {
      coordinator.restore(combinationString);
      void coordinator.enterCategory(activeCategory);
    },
    [activeCategory, coordinator],
  );

  const reset = useCallback(() => {
    coordinator.reset();
    void coordinator.enterCategory(activeCategory);
  }, [activeCategory, coordinator]);

  // Explicit "Save Build": checkpoint the current combination, then flush.
  const save = useCallback(async () => {
    coordinator.leaveCategory(activeCategory);
    await saveNow();
  }, [activeCategory, coordinator, saveNow]);

  // Whether entering a category would be free (already paid this session).
  const isCategoryPaid = useCallback(
    (category: CustomizationCategory) => coordinator.isCategoryPaid(category),
    [coordinator],
  );

  return {
    data,
    activeCategory,
    nav,
    credits,
    buildId,
    isSaved,
    isSaving,
    isCategoryPaid,
    setCredits,
    selectCategory,
    selectOption,
    goBack,
    goForward,
    restore,
    reset,
    save,
  };
}

export type UseCustomizationReturn = ReturnType<typeof useCustomization>;
