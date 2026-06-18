"use client";

import { CATEGORY_META } from "../core/customization-options/catalog";
import {
  CustomizationCategory,
  type CustomizationCategoryItem,
  type CustomizationData,
} from "../core/customization-options/types/CustomizationData";
import { CATEGORY_ICONS, CheckIcon, WheelGraphic } from "./icons";

type OptionsPanelProps = {
  data: CustomizationData;
  activeCategory: CustomizationCategory;
  onSelectOption: (category: CustomizationCategory, slug: string) => void;
};

export function OptionsPanel({
  data,
  activeCategory,
  onSelectOption,
}: OptionsPanelProps) {
  const meta = CATEGORY_META[activeCategory];
  const content = data.categories[activeCategory];
  const selectedSlug = data.selections[activeCategory];

  const total = content.items.length;
  const ready = content.items.filter(
    (item) => item.preview?.status === "generated",
  ).length;
  const isGenerating = content.items.some(
    (item) => item.preview?.status === "generating",
  );

  return (
    <section className="mt-6 rounded-2xl border border-white/5 bg-white/[0.02] p-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-lg">{meta.label}</h2>
          <p className="text-xs text-zinc-500">{meta.tagline}</p>
        </div>
        {isGenerating && (
          <span className="flex items-center gap-2 rounded-lg border border-violet-500/30 bg-violet-500/10 px-3 py-1.5 font-medium text-violet-300 text-xs">
            <span className="h-2 w-2 animate-pulse rounded-full bg-violet-400" />
            Generating previews… ({ready}/{total})
          </span>
        )}
      </div>

      <div className="slim-scrollbar -mx-1 mt-4 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-1 px-1 pb-3">
        {content.items.map((item) => (
          <OptionCard
            key={item.slug}
            category={activeCategory}
            item={item}
            isSelected={item.slug === selectedSlug}
            onSelect={() => onSelectOption(activeCategory, item.slug)}
          />
        ))}
      </div>
    </section>
  );
}

function OptionCard({
  category,
  item,
  isSelected,
  onSelect,
}: {
  category: CustomizationCategory;
  item: CustomizationCategoryItem;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex w-52 shrink-0 snap-start flex-col rounded-xl border p-3 text-left transition ${
        isSelected
          ? "border-violet-500/60 bg-violet-500/10"
          : "border-white/10 bg-[#0d0b16] hover:border-white/20"
      }`}
    >
      <OptionPreview category={category} item={item} />
      <span className="mt-3 font-semibold text-sm">{item.name}</span>
      <span className="mt-0.5 truncate text-[11px] text-zinc-500">
        {item.description}
      </span>
      <span className="mt-2">
        {isSelected ? (
          <span className="inline-flex items-center gap-1 rounded-md bg-gradient-to-r from-violet-600 to-blue-500 px-2 py-0.5 font-medium text-[11px] text-white">
            <CheckIcon className="h-3 w-3" />
            Selected
          </span>
        ) : (
          <span className="font-semibold text-sm text-violet-300">
            {item.price === 0 ? "Included" : `$${item.price.toLocaleString()}`}
          </span>
        )}
      </span>
    </button>
  );
}

function OptionPreview({
  category,
  item,
}: {
  category: CustomizationCategory;
  item: CustomizationCategoryItem;
}) {
  const status = item.preview?.status;
  const imageUrl = item.preview?.imageUrl;

  return (
    <span className="relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-[#08070f]">
      {imageUrl ? (
        // biome-ignore lint/performance/noImgElement: AI output is a dynamic remote URL; next/image would need per-host remotePatterns config.
        <img
          src={imageUrl}
          alt={item.name}
          className="h-full w-full object-contain"
        />
      ) : (
        <OptionFallback category={category} item={item} />
      )}

      {status === "generating" && (
        <span className="absolute inset-0 flex items-center justify-center bg-[#05040a]/60 backdrop-blur-[1px]">
          <span className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-violet-400" />
        </span>
      )}
    </span>
  );
}

/** Stylized placeholder shown until the option's preview image is ready. */
function OptionFallback({
  category,
  item,
}: {
  category: CustomizationCategory;
  item: CustomizationCategoryItem;
}) {
  if (category === CustomizationCategory.WHEELS) {
    return <WheelGraphic color={item.swatch} size={72} />;
  }

  if (category === CustomizationCategory.PAINT) {
    return (
      <span
        className="h-16 w-16 rounded-full border border-white/20 shadow-inner"
        style={{
          background: `radial-gradient(circle at 32% 28%, #ffffff60, transparent 45%), ${item.swatch}`,
        }}
      />
    );
  }

  const Icon = CATEGORY_ICONS[category];
  return (
    <span
      className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/15"
      style={{
        background: `linear-gradient(160deg, ${item.swatch}, #0d0b16)`,
      }}
    >
      <Icon className="h-7 w-7 text-white/80" />
    </span>
  );
}
