"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
}: {
  initialData: CustomizationData;
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

  useEffect(() => {
    const unsubscribe = coordinator.subscribe((next) => {
      setData(next);
      setNav(readNav(coordinator));
    });
    return unsubscribe;
  }, [coordinator]);

  // Force the first category to be active and generate its option previews
  // up-front, so the user lands on a populated category.
  useEffect(() => {
    setActiveCategory(CATEGORY_ORDER[0]);
    void coordinator.enterCategory(CATEGORY_ORDER[0]);
  }, [coordinator]);

  const selectCategory = useCallback(
    async (category: CustomizationCategory) => {
      if (category === activeCategory) {
        return;
      }
      await coordinator.leaveCategory(activeCategory);
      setActiveCategory(category);
      await coordinator.enterCategory(category);
    },
    [activeCategory, coordinator],
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

  return {
    data,
    activeCategory,
    nav,
    isSaved: savedCombination === nav.currentString,
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
