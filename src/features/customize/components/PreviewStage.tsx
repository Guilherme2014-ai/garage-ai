"use client";

import {
  type CombinationSelections,
  CustomizationCategory,
  type CustomizationData,
} from "../core/customization-options/types/CustomizationData";
import { findOptionInData } from "../core/customization-options/utils/findOptionInData";
import { RedoIcon, SparkleIcon, UndoIcon } from "./icons";

const BASE_PAINT = "#8b93a7";

type NavState = {
  canGoBack: boolean;
  canGoForward: boolean;
};

type PreviewStageProps = {
  data: CustomizationData;
  nav: NavState;
  onBack: () => void;
  onForward: () => void;
};

export function PreviewStage({
  data,
  nav,
  onBack,
  onForward,
}: PreviewStageProps) {
  const isGenerating = data.preview.status === "generating";
  const paint = findOptionInData(
    data,
    CustomizationCategory.PAINT,
    data.selections.paint,
  );
  const paintColor = paint?.swatch ?? BASE_PAINT;
  const modCount = countMods(data.selections);
  const imageUrl = data.preview.imageUrl;

  return (
    <div className="relative mx-auto mt-4 aspect-[16/9] w-full max-w-2xl overflow-hidden rounded-2xl border border-white/10 sm:mt-6">
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(circle at 30% 25%, ${paintColor}30, transparent 55%), radial-gradient(circle at 75% 75%, rgba(59,130,246,0.18), transparent 55%), linear-gradient(160deg, #160f2b, #0b0a16 55%, #05040a)`,
        }}
      />

      {imageUrl ? (
        // biome-ignore lint/performance/noImgElement: AI output is a dynamic remote URL; next/image would need per-host remotePatterns config.
        <img
          src={imageUrl}
          alt="Customized car preview"
          className="absolute inset-0 h-full w-full object-contain"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-sm text-zinc-500">
          No preview available
        </div>
      )}

      <div className="absolute top-3 left-3 flex items-center gap-2 rounded-lg border border-white/10 bg-black/50 px-2.5 py-1 font-medium text-xs text-zinc-200 backdrop-blur">
        <SparkleIcon className="h-3.5 w-3.5 text-violet-300" />
        {modCount === 0
          ? "Stock Build"
          : `${modCount} mod${modCount > 1 ? "s" : ""} applied`}
      </div>

      <div className="absolute top-3 right-3 flex items-center gap-1.5">
        {data.preview.status === "generated" && data.preview.renderedAt && (
          <span className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 font-medium text-[10px] text-emerald-400">
            Ready
          </span>
        )}
        <button
          type="button"
          onClick={onBack}
          disabled={!nav.canGoBack}
          aria-label="Undo"
          className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-black/50 text-zinc-200 backdrop-blur transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <UndoIcon className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={onForward}
          disabled={!nav.canGoForward}
          aria-label="Redo"
          className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-black/50 text-zinc-200 backdrop-blur transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <RedoIcon className="h-3.5 w-3.5" />
        </button>
      </div>

      {isGenerating && <GeneratingOverlay />}
    </div>
  );
}

function GeneratingOverlay() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[#05040a]/70 backdrop-blur-sm">
      <span className="relative flex h-10 w-10">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet-500/40" />
        <span className="relative inline-flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-blue-500 text-white">
          <SparkleIcon className="h-5 w-5" />
        </span>
      </span>
      <p className="font-medium text-sm text-zinc-200">Generating preview…</p>
    </div>
  );
}

function countMods(selections: CombinationSelections): number {
  return Object.values(selections).filter(Boolean).length;
}
