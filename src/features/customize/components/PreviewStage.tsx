"use client";

import {
  CATEGORY_ORDER,
  findOption,
} from "../core/customization-options/catalog";
import {
  CustomizationCategory,
  type CombinationSelections,
  type CustomizationData,
} from "../core/customization-options/types/CustomizationData";
import { parseCombinationString } from "../core/customization-options/utils/parseCombinationString";
import {
  RedoIcon,
  SparkleIcon,
  UndoIcon,
  WheelGraphic,
} from "./icons";

const BASE_PAINT = "#8b93a7";

const RIDE_DROP: Record<string, number> = {
  stock: 0,
  lowered: 9,
  coilovers: 13,
  airride: 17,
};

const WIDEBODY_SCALE: Record<string, number> = {
  oem: 1,
  street: 1.06,
  gt: 1.08,
  carbon: 1.05,
};

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
  const paint = findOption(CustomizationCategory.PAINT, data.selections.paint);
  const paintColor = paint?.swatch ?? BASE_PAINT;
  const modCount = countMods(data.selections);

  return (
    <div>
      <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl border border-white/10">
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(circle at 30% 25%, ${paintColor}40, transparent 55%), radial-gradient(circle at 75% 75%, rgba(59,130,246,0.18), transparent 55%), linear-gradient(160deg, #160f2b, #0b0a16 55%, #05040a)`,
          }}
        />
        <div className="absolute inset-x-0 top-10 mx-auto h-1 w-2/3 rounded-full bg-violet-400/30 blur-md" />

        <div className="absolute inset-0 flex items-center justify-center">
          <CarRender data={data} paintColor={paintColor} />
        </div>

        <div className="absolute top-4 left-4 flex items-center gap-2 rounded-lg border border-white/10 bg-black/50 px-3 py-1.5 font-medium text-sm text-zinc-200 backdrop-blur">
          <SparkleIcon className="h-4 w-4 text-violet-300" />
          {modCount === 0 ? "Stock Build" : `${modCount} mod${modCount > 1 ? "s" : ""} applied`}
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
        nav={nav}
        onBack={onBack}
        onForward={onForward}
        onRestore={onRestore}
      />
    </div>
  );
}

function CarRender({
  data,
  paintColor,
}: {
  data: CustomizationData;
  paintColor: string;
}) {
  const wheel = findOption(CustomizationCategory.WHEELS, data.selections.wheels);
  const lighting = findOption(
    CustomizationCategory.LIGHTING,
    data.selections.lighting,
  );
  const spoiler = data.selections[CustomizationCategory.SPOILERS];
  const hasSpoiler = !!spoiler && spoiler !== "none";

  const drop =
    RIDE_DROP[data.selections[CustomizationCategory.SUSPENSION] ?? "stock"] ?? 0;
  const widthScale =
    WIDEBODY_SCALE[data.selections[CustomizationCategory.BODY_KITS] ?? "oem"] ??
    1;

  const wheelColor = wheel?.swatch ?? "#3f3f46";
  const lightColor = lighting?.swatch ?? "#fcd34d";
  const bodyGradient = `linear-gradient(180deg, ${shade(paintColor, 30)}, ${paintColor} 45%, ${shade(paintColor, -25)})`;

  return (
    <div className="relative h-[46%] w-[64%]">
      {/* Body + cabin (affected by ride height + widebody) */}
      <div
        className="absolute inset-x-0 bottom-[14%]"
        style={{ transform: `translateY(${drop}px) scaleX(${widthScale})` }}
      >
        {/* Cabin / greenhouse */}
        <div
          className="absolute bottom-[58%] left-[24%] right-[20%] h-[58%] rounded-t-[60%_90%]"
          style={{ background: bodyGradient }}
        >
          <div className="absolute inset-x-3 top-[28%] bottom-[14%] rounded-[40%] bg-black/55" />
        </div>

        {/* Main body */}
        <div
          className="relative h-[46%] rounded-[28px] shadow-2xl shadow-black/50"
          style={{ background: bodyGradient }}
        >
          <div className="absolute inset-x-6 top-1/2 h-px -translate-y-1/2 bg-white/15" />

          {/* Headlight (front-right) */}
          <span
            className="absolute top-[28%] right-2 h-2.5 w-5 rounded-full"
            style={{
              background: lightColor,
              boxShadow: `0 0 16px 5px ${lightColor}`,
            }}
          />
          {/* Tail light (rear-left) */}
          <span className="absolute top-[28%] left-2 h-2.5 w-3 rounded-full bg-rose-500/80 shadow-[0_0_10px_2px_rgba(244,63,94,0.6)]" />

          {hasSpoiler && (
            <span className="absolute -top-2 left-1 h-1.5 w-8 rounded-full bg-zinc-200/80" />
          )}
        </div>
      </div>

      {/* Wheels (fixed to the ground) */}
      <div className="absolute bottom-0 left-[12%] h-[34%] w-[20%]">
        <WheelGraphic color={wheelColor} size={64} />
      </div>
      <div className="absolute bottom-0 right-[12%] h-[34%] w-[20%]">
        <WheelGraphic color={wheelColor} size={64} />
      </div>

      {/* Ground reflection */}
      <div className="absolute -bottom-3 left-1/2 h-3 w-[80%] -translate-x-1/2 rounded-[100%] bg-black/50 blur-md" />
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
  nav,
  onBack,
  onForward,
  onRestore,
}: {
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
          const swatches = describeCombination(combinationString);
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
                  swatches.slice(0, 5).map((entry) => (
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

function describeCombination(combinationString: string): SwatchEntry[] {
  const selections =
    parseCombinationString<CustomizationCategory>(combinationString);
  const entries: SwatchEntry[] = [];

  for (const category of CATEGORY_ORDER) {
    const option = findOption(category, selections[category]);
    if (option) {
      entries.push({ category, name: option.name, swatch: option.swatch });
    }
  }

  return entries;
}

function countMods(selections: CombinationSelections): number {
  return Object.values(selections).filter(Boolean).length;
}

/** Lightens (positive amount) or darkens (negative) a hex color. */
function shade(hex: string, amount: number): string {
  const normalized = hex.replace("#", "");
  if (normalized.length !== 6) {
    return hex;
  }
  const num = Number.parseInt(normalized, 16);
  const clamp = (value: number) => Math.max(0, Math.min(255, value));
  const r = clamp((num >> 16) + amount);
  const g = clamp(((num >> 8) & 0xff) + amount);
  const b = clamp((num & 0xff) + amount);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}
