"use client";

import { CATEGORY_META } from "../core/customization-options/catalog";
import {
  CustomizationCategory,
  type CustomizationCategoryItem,
  type CustomizationData,
} from "../core/customization-options/types/CustomizationData";
import { CATEGORY_ICONS, CheckIcon, WheelGraphic } from "./icons";

const SKELETON_KEYS = ["s1", "s2", "s3", "s4", "s5"];

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
  const isLoading = content.status !== "generated";

  return (
    <section className="mt-6 rounded-2xl border border-white/5 bg-white/[0.02] p-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-lg">{meta.label}</h2>
          <p className="text-xs text-zinc-500">{meta.tagline}</p>
        </div>
        {isLoading && (
          <span className="flex items-center gap-2 rounded-lg border border-violet-500/30 bg-violet-500/10 px-3 py-1.5 font-medium text-violet-300 text-xs">
            <span className="h-2 w-2 animate-pulse rounded-full bg-violet-400" />
            Generating options…
          </span>
        )}
      </div>

      <div className="mt-4 flex gap-4 overflow-x-auto pb-2">
        {isLoading
          ? SKELETON_KEYS.map((key) => <OptionSkeleton key={key} />)
          : content.items.map((item) => (
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
      className={`flex w-44 shrink-0 flex-col rounded-xl border p-4 text-left transition ${
        isSelected
          ? "border-violet-500/60 bg-violet-500/10"
          : "border-white/10 bg-[#0d0b16] hover:border-white/20"
      }`}
    >
      <span className="mx-auto mb-3 flex h-24 w-24 items-center justify-center">
        <OptionPreview category={category} item={item} />
      </span>
      <span className="font-semibold text-sm">{item.name}</span>
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
  if (category === CustomizationCategory.WHEELS) {
    return <WheelGraphic color={item.swatch} size={96} />;
  }

  if (category === CustomizationCategory.PAINT) {
    return (
      <span
        className="h-20 w-20 rounded-full border border-white/20 shadow-inner"
        style={{
          background: `radial-gradient(circle at 32% 28%, #ffffff60, transparent 45%), ${item.swatch}`,
        }}
      />
    );
  }

  const Icon = CATEGORY_ICONS[category];
  return (
    <span
      className="flex h-20 w-20 items-center justify-center rounded-2xl border border-white/15"
      style={{
        background: `linear-gradient(160deg, ${item.swatch}, #0d0b16)`,
      }}
    >
      <Icon className="h-8 w-8 text-white/80" />
    </span>
  );
}

function OptionSkeleton() {
  return (
    <div className="w-44 shrink-0 rounded-xl border border-white/10 bg-[#0d0b16] p-4">
      <div className="mx-auto mb-3 h-24 w-24 animate-pulse rounded-full bg-white/5" />
      <div className="h-3 w-24 animate-pulse rounded bg-white/5" />
      <div className="mt-2 h-2.5 w-32 animate-pulse rounded bg-white/5" />
      <div className="mt-3 h-3 w-12 animate-pulse rounded bg-white/5" />
    </div>
  );
}
