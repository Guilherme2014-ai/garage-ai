"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  CATEGORY_ORDER,
  createInitialCustomizationData,
} from "../core/customization-options/catalog";
import { CustomizationDataCoordinator } from "../core/customization-options/CustomizationData.coordinator";
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
 * exposes the category-flow and version-control actions to the UI.
 */
export function useCustomization() {
  const coordinatorRef = useRef<CustomizationDataCoordinator | null>(null);
  if (coordinatorRef.current === null) {
    coordinatorRef.current = new CustomizationDataCoordinator(
      createInitialCustomizationData(),
    );
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

  useEffect(() => {
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

  const goBack = useCallback(() => {
    coordinator.goBack();
  }, [coordinator]);

  const goForward = useCallback(() => {
    coordinator.goForward();
  }, [coordinator]);

  const restore = useCallback(
    (combinationString: string) => {
      coordinator.restore(combinationString);
    },
    [coordinator],
  );

  const reset = useCallback(() => {
    coordinator.reset();
  }, [coordinator]);

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
