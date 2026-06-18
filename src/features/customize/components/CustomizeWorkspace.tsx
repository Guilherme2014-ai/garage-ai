"use client";

import { useState } from "react";
import {
  CATEGORY_META,
  CATEGORY_ORDER,
} from "../core/customization-options/catalog";
import type {
  CustomizationCategory,
  CustomizationData,
} from "../core/customization-options/types/CustomizationData";
import { findOptionInData } from "../core/customization-options/utils/findOptionInData";
import { useCustomization } from "../hooks/useCustomization";
import { downloadImage } from "../utils/downloadImage";
import { BuildSummarySheet } from "./BuildSummarySheet";
import { CategoryPanel } from "./CategoryPanel";
import { CompareDialog } from "./CompareDialog";
import { ConfirmDialog } from "./ConfirmDialog";
import { ArrowRightIcon, CheckIcon, CompareIcon, DownloadIcon } from "./icons";
import { MobileCategoryTabs } from "./MobileCategoryTabs";
import { OptionsPanel } from "./OptionsPanel";
import { PreviewStage } from "./PreviewStage";

type CustomizeWorkspaceProps = {
  initialData: CustomizationData;
  carName: string;
};

export function CustomizeWorkspace({
  initialData,
  carName,
}: CustomizeWorkspaceProps) {
  const {
    data,
    activeCategory,
    nav,
    isSaved,
    selectCategory,
    selectOption,
    goBack,
    goForward,
    reset,
    save,
  } = useCustomization({ initialData });

  const [compareOpen, setCompareOpen] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [pendingCategory, setPendingCategory] =
    useState<CustomizationCategory | null>(null);
  const [dontAskAgain, setDontAskAgain] = useState(false);
  const [skipSwitchConfirm, setSkipSwitchConfirm] = useState(false);

  // Switching category checkpoints the build, so always confirm first (unless
  // the user opted out for the session).
  function requestSelectCategory(category: CustomizationCategory) {
    if (category === activeCategory) {
      return;
    }
    if (skipSwitchConfirm) {
      void selectCategory(category);
      return;
    }
    setDontAskAgain(false);
    setPendingCategory(category);
  }

  function confirmCategorySwitch() {
    if (dontAskAgain) {
      setSkipSwitchConfirm(true);
    }
    if (pendingCategory) {
      void selectCategory(pendingCategory);
    }
    setPendingCategory(null);
  }

  const activeMeta = CATEGORY_META[activeCategory];
  const pendingMeta = pendingCategory ? CATEGORY_META[pendingCategory] : null;

  const summary = buildSummary(data);
  const baseImageUrl = initialData.preview.imageUrl;
  const previewUrl = data.preview.imageUrl;
  const isGenerating = data.preview.status === "generating";

  const canDownload = !!previewUrl && !isGenerating;
  const canCompare =
    !!previewUrl && !!baseImageUrl && summary.count > 0 && !isGenerating;

  async function handleDownload() {
    if (!previewUrl) {
      return;
    }
    setIsDownloading(true);
    try {
      await downloadImage(previewUrl, buildFileName(carName));
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-[#07060d] text-zinc-100 lg:flex-row">
      <CategoryPanel
        data={data}
        activeCategory={activeCategory}
        isSaved={isSaved}
        onSelectCategory={requestSelectCategory}
        onSave={save}
        onReset={reset}
      />

      <main className="flex min-w-0 flex-1 flex-col">
        <TopBar
          isSaved={isSaved}
          carName={carName}
          canCompare={canCompare}
          canDownload={canDownload}
          isDownloading={isDownloading}
          onCompare={() => setCompareOpen(true)}
          onDownload={handleDownload}
        />

        <MobileCategoryTabs
          data={data}
          activeCategory={activeCategory}
          onSelectCategory={requestSelectCategory}
        />

        <div className="flex-1 overflow-y-auto px-4 pb-4 sm:px-6">
          <PreviewStage
            data={data}
            nav={nav}
            onBack={goBack}
            onForward={goForward}
          />
          <OptionsPanel
            data={data}
            activeCategory={activeCategory}
            onSelectOption={selectOption}
          />
        </div>

        <BuildSummaryBar
          count={summary.count}
          total={summary.total}
          onViewBuild={() => setSummaryOpen(true)}
        />
      </main>

      {baseImageUrl && previewUrl && (
        <CompareDialog
          open={compareOpen}
          beforeUrl={baseImageUrl}
          afterUrl={previewUrl}
          modCount={summary.count}
          onClose={() => setCompareOpen(false)}
        />
      )}

      <BuildSummarySheet
        open={summaryOpen}
        data={data}
        carName={carName}
        count={summary.count}
        total={summary.total}
        canDownload={canDownload}
        isDownloading={isDownloading}
        isSaved={isSaved}
        onDownload={handleDownload}
        onSave={save}
        onReset={reset}
        onClose={() => setSummaryOpen(false)}
      />

      <ConfirmDialog
        open={pendingCategory !== null}
        title="Switch category?"
        message={
          <>
            You're moving from{" "}
            <span className="text-zinc-200">{activeMeta.label}</span>
            {pendingMeta ? (
              <>
                {" "}
                to <span className="text-zinc-200">{pendingMeta.label}</span>
              </>
            ) : null}
            . Your build is saved automatically, so you can come back and change
            it anytime.
          </>
        }
        confirmLabel="Continue"
        cancelLabel="Stay here"
        checkbox={{
          label: "Don't ask again this session",
          checked: dontAskAgain,
          onChange: setDontAskAgain,
        }}
        onConfirm={confirmCategorySwitch}
        onCancel={() => setPendingCategory(null)}
      />
    </div>
  );
}

function TopBar({
  isSaved,
  carName,
  canCompare,
  canDownload,
  isDownloading,
  onCompare,
  onDownload,
}: {
  isSaved: boolean;
  carName: string;
  canCompare: boolean;
  canDownload: boolean;
  isDownloading: boolean;
  onCompare: () => void;
  onDownload: () => void;
}) {
  return (
    <header className="flex items-center justify-between gap-3 border-white/5 border-b px-4 py-3 sm:px-6 sm:py-4 lg:border-b-0">
      <div className="flex min-w-0 items-center gap-2.5">
        <span className="truncate font-semibold text-base sm:text-lg">
          {carName || "My Build"}
        </span>
        {isSaved ? (
          <span className="hidden items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 font-medium text-emerald-400 text-xs sm:inline-flex">
            <CheckIcon className="h-3 w-3" />
            Saved
          </span>
        ) : (
          <span className="hidden items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 font-medium text-amber-400 text-xs sm:inline-flex">
            Unsaved changes
          </span>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={onCompare}
          disabled={!canCompare}
          className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 font-medium text-sm text-zinc-300 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40 sm:px-4"
        >
          <CompareIcon className="h-4 w-4" />
          <span className="hidden sm:inline">Compare</span>
        </button>
        <button
          type="button"
          onClick={onDownload}
          disabled={!canDownload || isDownloading}
          className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-violet-600 to-blue-500 px-3 py-2 font-medium text-sm text-white shadow-lg shadow-violet-900/30 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 sm:px-4"
        >
          {isDownloading ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          ) : (
            <DownloadIcon className="h-4 w-4" />
          )}
          <span className="hidden sm:inline">
            {isDownloading ? "Preparing…" : "Download"}
          </span>
        </button>
      </div>
    </header>
  );
}

function BuildSummaryBar({
  count,
  total,
  onViewBuild,
}: {
  count: number;
  total: number;
  onViewBuild: () => void;
}) {
  return (
    <footer className="flex items-center justify-between gap-4 border-white/5 border-t bg-[#0a0912] px-4 py-3 sm:px-6 sm:py-4">
      <div className="flex min-w-0 flex-col">
        <span className="font-semibold text-sm">Build Summary</span>
        <span className="text-violet-400 text-xs">
          {count} {count === 1 ? "Item" : "Items"} · ${total.toLocaleString()}
        </span>
      </div>
      <button
        type="button"
        onClick={onViewBuild}
        className="flex shrink-0 items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-blue-500 px-5 py-2.5 font-medium text-sm text-white shadow-lg shadow-violet-900/30 transition hover:opacity-90 sm:px-6 sm:py-3"
      >
        View Build
        <ArrowRightIcon className="h-4 w-4" />
      </button>
    </footer>
  );
}

function buildSummary(data: CustomizationData): {
  count: number;
  total: number;
} {
  let count = 0;
  let total = 0;

  for (const category of CATEGORY_ORDER) {
    const option = findOptionInData(data, category, data.selections[category]);
    if (option) {
      count += 1;
      total += option.price;
    }
  }

  return { count, total };
}

function buildFileName(carName: string): string {
  const base = carName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-");
  const trimmed = base.replace(/^-+|-+$/g, "");
  return `${trimmed || "garage-ai-build"}.png`;
}
