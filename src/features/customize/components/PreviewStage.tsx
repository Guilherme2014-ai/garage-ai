"use client";

import { CATEGORY_ORDER } from "../core/customization-options/catalog";
import {
  type CombinationSelections,
  CustomizationCategory,
  type CustomizationData,
} from "../core/customization-options/types/CustomizationData";
import { findOptionInData } from "../core/customization-options/utils/findOptionInData";
import { parseCombinationString } from "../core/customization-options/utils/parseCombinationString";
import { RedoIcon, SparkleIcon, UndoIcon } from "./icons";

const BASE_PAINT = "#8b93a7";

type NavState = {
  canGoBack: boolean;
  canGoForward: boolean;
  history: string[];
  currentString: string;
  currentIndex: number;
};

type PreviewStageProps = {
  data: CustomizationData;
  nav: NavState;
  onBack: () => void;
  onForward: () => void;
  onRestore: (combinationString: string) => void;
};

export function PreviewStage({
  data,
  nav,
  onBack,
  onForward,
  onRestore,
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
    <div>
      <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl border border-white/10">
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

        <div className="absolute top-4 left-4 flex items-center gap-2 rounded-lg border border-white/10 bg-black/50 px-3 py-1.5 font-medium text-sm text-zinc-200 backdrop-blur">
          <SparkleIcon className="h-4 w-4 text-violet-300" />
          {modCount === 0
            ? "Stock Build"
            : `${modCount} mod${modCount > 1 ? "s" : ""} applied`}
        </div>

        <div className="absolute top-4 right-4 flex items-center gap-1.5">
          {data.preview.status === "generated" && data.preview.renderedAt && (
            <span className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 font-medium text-[11px] text-emerald-400">
              Preview ready
            </span>
          )}
        </div>

        {isGenerating && <GeneratingOverlay />}
      </div>

      <VersionHistory
        data={data}
        nav={nav}
        onBack={onBack}
        onForward={onForward}
        onRestore={onRestore}
      />
    </div>
  );
}

function GeneratingOverlay() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#05040a]/70 backdrop-blur-sm">
      <span className="relative flex h-12 w-12">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet-500/40" />
        <span className="relative inline-flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-blue-500 text-white">
          <SparkleIcon className="h-6 w-6" />
        </span>
      </span>
      <p className="font-medium text-sm text-zinc-200">Generating preview…</p>
      <p className="text-xs text-zinc-500">
        Applying your latest modification on top of the build
      </p>
    </div>
  );
}

function VersionHistory({
  data,
  nav,
  onBack,
  onForward,
  onRestore,
}: {
  data: CustomizationData;
  nav: NavState;
  onBack: () => void;
  onForward: () => void;
  onRestore: (combinationString: string) => void;
}) {
  return (
    <div className="mt-5">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="font-semibold text-sm">Version History</p>
          <p className="text-xs text-zinc-500">
            Every change is a checkpoint you can return to
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onBack}
            disabled={!nav.canGoBack}
            aria-label="Undo"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-zinc-300 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <UndoIcon className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onForward}
            disabled={!nav.canGoForward}
            aria-label="Redo"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-zinc-300 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <RedoIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-1">
        {nav.history.map((combinationString, index) => {
          const isActive = combinationString === nav.currentString;
          const swatches = describeCombination(data, combinationString);
          return (
            <button
              key={combinationString || "stock"}
              type="button"
              onClick={() => onRestore(combinationString)}
              className={`group flex w-28 shrink-0 flex-col gap-2 rounded-xl border p-3 text-left transition ${
                isActive
                  ? "border-violet-500/60 bg-violet-500/10"
                  : "border-white/10 bg-white/[0.02] hover:bg-white/5"
              }`}
            >
              <span className="flex items-center justify-between">
                <span
                  className={`text-[11px] font-semibold ${isActive ? "text-white" : "text-zinc-400"}`}
                >
                  {index === 0 ? "Stock" : `v${index}`}
                </span>
                <span className="text-[10px] text-zinc-600">
                  {swatches.length} mod{swatches.length === 1 ? "" : "s"}
                </span>
              </span>
              <span className="flex h-6 items-center gap-1">
                {swatches.length === 0 ? (
                  <span className="text-[10px] text-zinc-600">Base build</span>
                ) : (
                  swatches
                    .slice(0, 5)
                    .map((entry) => (
                      <span
                        key={entry.category}
                        title={entry.name}
                        className="h-4 w-4 rounded-full border border-white/20"
                        style={{ background: entry.swatch }}
                      />
                    ))
                )}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

type SwatchEntry = {
  category: CustomizationCategory;
  name: string;
  swatch: string;
};

function describeCombination(
  data: CustomizationData,
  combinationString: string,
): SwatchEntry[] {
  const selections =
    parseCombinationString<CustomizationCategory>(combinationString);
  const entries: SwatchEntry[] = [];

  for (const category of CATEGORY_ORDER) {
    const option = findOptionInData(data, category, selections[category]);
    if (option) {
      entries.push({ category, name: option.name, swatch: option.swatch });
    }
  }

  return entries;
}

function countMods(selections: CombinationSelections): number {
  return Object.values(selections).filter(Boolean).length;
}
