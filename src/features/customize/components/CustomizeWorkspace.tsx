"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchCredits } from "../api/creditsApi";
import { CREDITS_PER_CATEGORY } from "../core/credits/credits";
import {
  CATEGORY_META,
  CATEGORY_ORDER,
} from "../core/customization-options/catalog";
import type {
  CustomizationCategory,
  CustomizationData,
} from "../core/customization-options/types/CustomizationData";
import { findOptionInData } from "../core/customization-options/utils/findOptionInData";
import type { PlanMode } from "../core/plan/planMode";
import { useCustomization } from "../hooks/useCustomization";
import { downloadImage } from "../utils/downloadImage";
import { CategoryPanel } from "./CategoryPanel";
import { CompareDialog } from "./CompareDialog";
import { ConfirmDialog } from "./ConfirmDialog";
import {
  CheckIcon,
  CompareIcon,
  DownloadIcon,
  ResetIcon,
  SaveIcon,
  SparkleIcon,
} from "./icons";
import { MobileCategoryTabs } from "./MobileCategoryTabs";
import { OptionsPanel } from "./OptionsPanel";
import { PreviewStage } from "./PreviewStage";
import { UpgradeDialog } from "./UpgradeDialog";

type CustomizeWorkspaceProps = {
  initialData: CustomizationData;
  carName: string;
  planMode: PlanMode;
  initialCredits: number;
};

/** How long after entering the page the free-plan upsell appears (1m30s). */
const UPSELL_DELAY_MS = 90_000;

export function CustomizeWorkspace({
  initialData,
  carName,
  planMode: initialPlanMode,
  initialCredits,
}: CustomizeWorkspaceProps) {
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  const openUpgrade = useCallback(() => setUpgradeOpen(true), []);

  const {
    data,
    activeCategory,
    nav,
    credits,
    isSaved,
    isCategoryPaid,
    setCredits,
    selectCategory,
    selectOption,
    goBack,
    goForward,
    reset,
    save,
  } = useCustomization({
    initialData,
    initialCredits,
    onNeedCredits: openUpgrade,
  });

  // Plan mode can change after a purchase (free -> top-up), so it lives in
  // state and is refreshed alongside the balance when the user returns.
  const [planMode, setPlanMode] = useState<PlanMode>(initialPlanMode);
  const [compareOpen, setCompareOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [pendingCategory, setPendingCategory] =
    useState<CustomizationCategory | null>(null);

  const isFree = planMode === "free";

  // Free users get a gentle nudge toward upgrading a while after they land.
  useEffect(() => {
    if (!isFree) {
      return;
    }
    const timer = setTimeout(() => setUpgradeOpen(true), UPSELL_DELAY_MS);
    return () => clearTimeout(timer);
  }, [isFree]);

  // Checkout happens in another tab; when the user returns, refresh the balance
  // and plan so a completed purchase is reflected without losing the build.
  useEffect(() => {
    async function refresh() {
      try {
        const next = await fetchCredits();
        setCredits(next.credits);
        setPlanMode(next.planMode);
      } catch {
        // best-effort; the next action will surface any real problem
      }
    }
    window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
  }, [setCredits]);

  // Switching into a not-yet-paid category spends 5 credits, so confirm first.
  // Re-entering a paid category is free and instant (no prompt); if the balance
  // can't cover a new category, jump straight to the buy-credits dialog.
  function requestSelectCategory(category: CustomizationCategory) {
    if (category === activeCategory) {
      return;
    }
    if (isCategoryPaid(category)) {
      void selectCategory(category);
      return;
    }
    if (credits < CREDITS_PER_CATEGORY) {
      setUpgradeOpen(true);
      return;
    }
    setPendingCategory(category);
  }

  function confirmCategorySwitch() {
    if (pendingCategory) {
      void selectCategory(pendingCategory);
    }
    setPendingCategory(null);
  }

  const activeMeta = CATEGORY_META[activeCategory];
  const pendingMeta = pendingCategory ? CATEGORY_META[pendingCategory] : null;

  const modCount = countSelections(data);
  const baseImageUrl = initialData.preview.imageUrl;
  const previewUrl = data.preview.imageUrl;
  const isGenerating = data.preview.status === "generating";

  // Downloads are a top-up privilege; free users get the upsell instead.
  const canDownload = !isFree && !!previewUrl && !isGenerating;
  const canCompare =
    !!previewUrl && !!baseImageUrl && modCount > 0 && !isGenerating;

  async function handleDownload() {
    if (isFree) {
      setUpgradeOpen(true);
      return;
    }
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
          credits={credits}
          canCompare={canCompare}
          canDownload={canDownload}
          isDownloading={isDownloading}
          isFree={isFree}
          onBuyCredits={() => setUpgradeOpen(true)}
          onCompare={() => setCompareOpen(true)}
          onDownload={handleDownload}
          onSave={save}
          onReset={reset}
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
      </main>

      {baseImageUrl && previewUrl && (
        <CompareDialog
          open={compareOpen}
          beforeUrl={baseImageUrl}
          afterUrl={previewUrl}
          modCount={modCount}
          onClose={() => setCompareOpen(false)}
        />
      )}

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
            . This uses{" "}
            <span className="font-medium text-violet-300">
              {CREDITS_PER_CATEGORY} credits
            </span>{" "}
            — you have <span className="text-zinc-200">{credits}</span>. Your
            build is saved automatically, so you can come back anytime for free.
          </>
        }
        confirmLabel={`Use ${CREDITS_PER_CATEGORY} credits`}
        cancelLabel="Stay here"
        onConfirm={confirmCategorySwitch}
        onCancel={() => setPendingCategory(null)}
      />

      <UpgradeDialog open={upgradeOpen} onClose={() => setUpgradeOpen(false)} />
    </div>
  );
}

function TopBar({
  isSaved,
  carName,
  credits,
  canCompare,
  canDownload,
  isDownloading,
  isFree,
  onBuyCredits,
  onCompare,
  onDownload,
  onSave,
  onReset,
}: {
  isSaved: boolean;
  carName: string;
  credits: number;
  canCompare: boolean;
  canDownload: boolean;
  isDownloading: boolean;
  isFree: boolean;
  onBuyCredits: () => void;
  onCompare: () => void;
  onDownload: () => void;
  onSave: () => void;
  onReset: () => void;
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
          onClick={onBuyCredits}
          title="Add credits"
          className="flex items-center gap-1.5 rounded-lg border border-violet-500/30 bg-violet-500/10 px-3 py-2 font-medium text-sm text-violet-200 transition hover:bg-violet-500/20"
        >
          <SparkleIcon className="h-4 w-4" />
          <span className="tabular-nums">{credits}</span>
          <span className="hidden sm:inline">credits</span>
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={isSaved}
          aria-label="Save"
          className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 font-medium text-sm text-zinc-300 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40 lg:hidden"
        >
          {isSaved ? (
            <CheckIcon className="h-4 w-4" />
          ) : (
            <SaveIcon className="h-4 w-4" />
          )}
        </button>
        <button
          type="button"
          onClick={onReset}
          aria-label="Reset"
          className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 font-medium text-sm text-zinc-300 transition hover:bg-white/10 lg:hidden"
        >
          <ResetIcon className="h-4 w-4" />
        </button>
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
          disabled={!isFree && (!canDownload || isDownloading)}
          title={isFree ? "Add credits to download your build" : undefined}
          className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-violet-600 to-blue-500 px-3 py-2 font-medium text-sm text-white shadow-lg shadow-violet-900/30 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 sm:px-4"
        >
          {isDownloading ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          ) : isFree ? (
            <SparkleIcon className="h-4 w-4" />
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

/** Number of categories with a selected option in the current combination. */
function countSelections(data: CustomizationData): number {
  let count = 0;

  for (const category of CATEGORY_ORDER) {
    const option = findOptionInData(data, category, data.selections[category]);
    if (option) {
      count += 1;
    }
  }

  return count;
}

function buildFileName(carName: string): string {
  const base = carName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-");
  const trimmed = base.replace(/^-+|-+$/g, "");
  return `${trimmed || "garage-ai-build"}.png`;
}
