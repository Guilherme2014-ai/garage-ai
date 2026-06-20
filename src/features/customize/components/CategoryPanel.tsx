"use client";

import Link from "next/link";
import {
  getActiveCategories,
  getCategoryMeta,
} from "../core/customization-options/catalog";
import type {
  CustomizationCategory,
  CustomizationData,
} from "../core/customization-options/types/CustomizationData";
import { findOptionInData } from "../core/customization-options/utils/findOptionInData";
import {
  ArrowLeftIcon,
  CheckIcon,
  ChevronRightIcon,
  getCategoryIcon,
  ResetIcon,
  SaveIcon,
} from "./icons";

type CategoryPanelProps = {
  data: CustomizationData;
  activeCategory: CustomizationCategory;
  isSaved: boolean;
  isSaving: boolean;
  onSelectCategory: (category: CustomizationCategory) => void;
  onSave: () => void;
  onReset: () => void;
};

export function CategoryPanel({
  data,
  activeCategory,
  isSaved,
  isSaving,
  onSelectCategory,
  onSave,
  onReset,
}: CategoryPanelProps) {
  return (
    <aside className="hidden w-80 shrink-0 flex-col border-white/5 border-r bg-[#0a0912] lg:flex">
      <div className="px-5 pt-5">
        <div className="flex items-center gap-2">
          <Link
            href="/"
            aria-label="Back to home"
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-zinc-300 transition hover:bg-white/10 hover:text-white"
          >
            <ArrowLeftIcon className="h-4 w-4" />
          </Link>
          <span className="font-bold text-xl tracking-tight">
            Customization
          </span>
        </div>
        <p className="mt-1 ml-9 text-xs text-zinc-500">Make it yours ✨</p>
      </div>

      <div className="slim-scrollbar mt-4 flex-1 space-y-1.5 overflow-y-auto px-4 pb-4">
        {getActiveCategories(data).map((category) => {
          const meta = getCategoryMeta(category);
          const content = data.categories[category];
          const Icon = getCategoryIcon(category);
          const isActive = category === activeCategory;
          const selected = findOptionInData(
            data,
            category,
            data.selections[category],
          );
          const isGenerating = content.items.some(
            (item) => item.preview?.status === "generating",
          );

          return (
            <button
              key={category}
              type="button"
              onClick={() => onSelectCategory(category)}
              className={`flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left transition ${
                isActive
                  ? "border-violet-500/40 bg-gradient-to-r from-violet-600/20 to-blue-500/10"
                  : "border-transparent hover:bg-white/5"
              }`}
            >
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                  isActive
                    ? "bg-gradient-to-br from-violet-600 to-blue-500 text-white"
                    : "bg-white/5 text-zinc-400"
                }`}
              >
                <Icon className="h-4 w-4" />
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="font-medium text-sm">{meta.label}</span>
                <span className="truncate text-[11px] text-zinc-500">
                  {selected ? selected.name : meta.tagline}
                </span>
              </span>
              <CategoryStatusBadge
                isGenerating={isGenerating}
                hasSelection={!!selected}
              />
              <ChevronRightIcon className="h-4 w-4 shrink-0 text-zinc-600" />
            </button>
          );
        })}
      </div>

      <div className="space-y-2 border-white/5 border-t p-4">
        <button
          type="button"
          onClick={onSave}
          disabled={isSaved || isSaving}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-blue-500 py-3 font-medium text-sm text-white shadow-lg shadow-violet-900/30 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSaving ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Saving…
            </>
          ) : isSaved ? (
            <>
              <CheckIcon className="h-4 w-4" />
              Build Saved
            </>
          ) : (
            <>
              <SaveIcon className="h-4 w-4" />
              Save Build
            </>
          )}
        </button>
        <button
          type="button"
          onClick={onReset}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-3 font-medium text-sm text-zinc-300 transition hover:bg-white/10"
        >
          <ResetIcon className="h-4 w-4" />
          Reset All
        </button>
      </div>
    </aside>
  );
}

function CategoryStatusBadge({
  isGenerating,
  hasSelection,
}: {
  isGenerating: boolean;
  hasSelection: boolean;
}) {
  if (isGenerating) {
    return (
      <span className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-violet-400" />
    );
  }

  if (hasSelection) {
    return (
      <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
        <CheckIcon className="h-2.5 w-2.5" />
      </span>
    );
  }

  return <span className="h-2 w-2 shrink-0 rounded-full bg-white/15" />;
}
