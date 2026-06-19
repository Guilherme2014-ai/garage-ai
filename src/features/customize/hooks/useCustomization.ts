"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { chargeCategory } from "../api/creditsApi";
import { editCarImage } from "../api/customizeApi";
import { CustomizationDataCoordinator } from "../core/customization-options/CustomizationData.coordinator";
import { CATEGORY_ORDER } from "../core/customization-options/catalog";
import type {
  CustomizationCategory,
  CustomizationData,
} from "../core/customization-options/types/CustomizationData";

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
 * is built from the LLM options response; selecting an option drives a real AI
 * edit of the current car image via the customization edit route.
 */
export function useCustomization({
  initialData,
  initialCredits,
  onNeedCredits,
}: {
  initialData: CustomizationData;
  /** The user's credit balance when the workspace mounted. */
  initialCredits: number;
  /** Called when a category can't be entered for lack of credits. */
  onNeedCredits: () => void;
}) {
  const coordinatorRef = useRef<CustomizationDataCoordinator | null>(null);
  if (coordinatorRef.current === null) {
    coordinatorRef.current = new CustomizationDataCoordinator(initialData, {
      generatePreview: async ({ currentImageUrl, option }) => {
        if (!currentImageUrl) {
          throw new Error("Missing current car image");
        }
        return editCarImage({
          imageUrl: currentImageUrl,
          name: option.name,
          visualDescription: option.visualDescription,
        });
      },
    });
  }
  const coordinator = coordinatorRef.current;

  const [data, setData] = useState<CustomizationData>(() =>
    coordinator.getData(),
  );
  const [activeCategory, setActiveCategory] = useState<CustomizationCategory>(
    CATEGORY_ORDER[0],
  );
  const [nav, setNav] = useState<NavState>(() => readNav(coordinator));
  const [savedCombination, setSavedCombination] = useState<string>(() =>
    coordinator.currentCombinationString(),
  );
  const [credits, setCredits] = useState(initialCredits);

  // Categories already paid for this build session. Re-entering one (a switch
  // back, history nav, undo/redo, reset) never recharges.
  const paidCategoriesRef = useRef<Set<CustomizationCategory>>(new Set());

  /**
   * Charges 5 credits for first-time entry into a category. Returns whether the
   * category may be entered: `true` if already paid or the charge succeeded;
   * `false` (and triggers the buy-credits prompt) when the balance can't cover
   * it. A failed charge never enters/generates previews, so credits and visible
   * previews stay in sync.
   */
  const guardEnter = useCallback(
    async (category: CustomizationCategory): Promise<boolean> => {
      if (paidCategoriesRef.current.has(category)) {
        return true;
      }
      const result = await chargeCategory();
      if (result.ok) {
        paidCategoriesRef.current.add(category);
        setCredits(result.credits);
        return true;
      }
      if (result.insufficient) {
        onNeedCredits();
      }
      return false;
    },
    [onNeedCredits],
  );

  useEffect(() => {
    const unsubscribe = coordinator.subscribe((next) => {
      setData(next);
      setNav(readNav(coordinator));
    });
    return unsubscribe;
  }, [coordinator]);

  // Force the first category to be active and generate its option previews
  // up-front (charging for it), so the user lands on a populated category.
  useEffect(() => {
    const first = CATEGORY_ORDER[0];
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
      await coordinator.leaveCategory(activeCategory);
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

  const save = useCallback(async () => {
    await coordinator.leaveCategory(activeCategory);
    setSavedCombination(coordinator.currentCombinationString());
  }, [activeCategory, coordinator]);

  // Whether entering a category would be free (already paid this session).
  const isCategoryPaid = useCallback(
    (category: CustomizationCategory) =>
      paidCategoriesRef.current.has(category),
    [],
  );

  return {
    data,
    activeCategory,
    nav,
    credits,
    isSaved: savedCombination === nav.currentString,
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
