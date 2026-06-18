"use client";

import { useEffect } from "react";
import {
  CATEGORY_META,
  CATEGORY_ORDER,
} from "../core/customization-options/catalog";
import type { CustomizationData } from "../core/customization-options/types/CustomizationData";
import { findOptionInData } from "../core/customization-options/utils/findOptionInData";
import {
  CATEGORY_ICONS,
  CheckIcon,
  DownloadIcon,
  ResetIcon,
  SaveIcon,
  XIcon,
} from "./icons";

type BuildSummarySheetProps = {
  open: boolean;
  data: CustomizationData;
  carName: string;
  count: number;
  total: number;
  canDownload: boolean;
  isDownloading: boolean;
  isSaved: boolean;
  onDownload: () => void;
  onSave: () => void;
  onReset: () => void;
  onClose: () => void;
};

/**
 * Itemized breakdown of the current build: every category with its selected
 * option and price, the running total, and a download shortcut. Presented as a
 * bottom sheet on mobile and a centred dialog on larger screens.
 */
export function BuildSummarySheet({
  open,
  data,
  carName,
  count,
  total,
  canDownload,
  isDownloading,
  isSaved,
  onDownload,
  onSave,
  onReset,
  onClose,
}: BuildSummarySheetProps) {
  useEffect(() => {
    if (!open) {
      return;
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-sm sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Build summary"
    >
      <button
        type="button"
        aria-label="Close build summary"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
      />

      <div className="relative flex max-h-[85vh] w-full max-w-md flex-col rounded-t-3xl border border-white/10 bg-[#0a0912] sm:rounded-3xl">
        <div className="flex items-start justify-between gap-3 border-white/5 border-b px-5 py-4">
          <div className="min-w-0">
            <h2 className="truncate font-semibold text-lg">
              {carName || "My Build"}
            </h2>
            <p className="text-violet-400 text-xs">
              {count} {count === 1 ? "item" : "items"} added
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close build summary"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-zinc-300 transition hover:bg-white/10"
          >
            <XIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="slim-scrollbar flex-1 space-y-1.5 overflow-y-auto px-5 py-4">
          {CATEGORY_ORDER.map((category) => {
            const meta = CATEGORY_META[category];
            const Icon = CATEGORY_ICONS[category];
            const option = findOptionInData(
              data,
              category,
              data.selections[category],
            );

            return (
              <div
                key={category}
                className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2.5"
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                    option
                      ? "bg-gradient-to-br from-violet-600 to-blue-500 text-white"
                      : "bg-white/5 text-zinc-500"
                  }`}
                >
                  {option ? (
                    <CheckIcon className="h-4 w-4" />
                  ) : (
                    <Icon className="h-4 w-4" />
                  )}
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="text-[11px] text-zinc-500">
                    {meta.label}
                  </span>
                  <span className="truncate font-medium text-sm">
                    {option ? option.name : "Not selected"}
                  </span>
                </span>
                <span className="shrink-0 font-semibold text-sm">
                  {option
                    ? option.price === 0
                      ? "Included"
                      : `$${option.price.toLocaleString()}`
                    : "—"}
                </span>
              </div>
            );
          })}
        </div>

        <div className="space-y-3 border-white/5 border-t px-5 py-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-400">Estimated total</span>
            <span className="font-bold text-xl">${total.toLocaleString()}</span>
          </div>
          <button
            type="button"
            onClick={onDownload}
            disabled={!canDownload || isDownloading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-blue-500 py-3 font-medium text-sm text-white shadow-lg shadow-violet-900/30 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isDownloading ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Preparing…
              </>
            ) : (
              <>
                <DownloadIcon className="h-4 w-4" />
                Download build image
              </>
            )}
          </button>

          <div className="grid grid-cols-2 gap-2 lg:hidden">
            <button
              type="button"
              onClick={onSave}
              disabled={isSaved}
              className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-2.5 font-medium text-sm text-zinc-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaved ? (
                <>
                  <CheckIcon className="h-4 w-4" />
                  Saved
                </>
              ) : (
                <>
                  <SaveIcon className="h-4 w-4" />
                  Save
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onReset}
              className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-2.5 font-medium text-sm text-zinc-200 transition hover:bg-white/10"
            >
              <ResetIcon className="h-4 w-4" />
              Reset
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
