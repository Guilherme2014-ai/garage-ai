"use client";

import {
  CATEGORY_META,
  CATEGORY_ORDER,
} from "../core/customization-options/catalog";
import type {
  CustomizationCategory,
  CustomizationData,
} from "../core/customization-options/types/CustomizationData";
import { findOptionInData } from "../core/customization-options/utils/findOptionInData";
import { CATEGORY_ICONS } from "./icons";

type MobileCategoryTabsProps = {
  data: CustomizationData;
  activeCategory: CustomizationCategory;
  onSelectCategory: (category: CustomizationCategory) => void;
};

/**
 * Horizontal, swipeable category selector shown in place of the desktop sidebar
 * on small screens.
 */
export function MobileCategoryTabs({
  data,
  activeCategory,
  onSelectCategory,
}: MobileCategoryTabsProps) {
  return (
    <div className="slim-scrollbar flex gap-2 overflow-x-auto border-white/5 border-b px-4 py-3 lg:hidden">
      {CATEGORY_ORDER.map((category) => {
        const meta = CATEGORY_META[category];
        const Icon = CATEGORY_ICONS[category];
        const isActive = category === activeCategory;
        const selected = findOptionInData(
          data,
          category,
          data.selections[category],
        );
        const isGenerating = data.categories[category].items.some(
          (item) => item.preview?.status === "generating",
        );

        return (
          <button
            key={category}
            type="button"
            onClick={() => onSelectCategory(category)}
            className={`flex shrink-0 items-center gap-2 rounded-full border px-3 py-2 text-sm transition ${
              isActive
                ? "border-violet-500/40 bg-gradient-to-r from-violet-600/30 to-blue-500/20 text-white"
                : "border-white/10 bg-white/5 text-zinc-400"
            }`}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span className="font-medium">{meta.label}</span>
            {isGenerating ? (
              <span className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-violet-400" />
            ) : selected ? (
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
