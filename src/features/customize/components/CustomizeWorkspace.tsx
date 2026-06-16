"use client";

import Image from "next/image";
import Link from "next/link";
import {
  CATEGORY_ORDER,
  findOption,
} from "../core/customization-options/catalog";
import type { CombinationSelections } from "../core/customization-options/types/CustomizationData";
import { useCustomization } from "../hooks/useCustomization";
import { CategoryPanel } from "./CategoryPanel";
import {
  ArrowRightIcon,
  BookmarkIcon,
  CheckIcon,
  ChevronDownIcon,
  CompareIcon,
  DownloadIcon,
  HomeIcon,
  ImageIcon,
  SettingsIcon,
  TargetIcon,
  UserIcon,
} from "./icons";
import { OptionsPanel } from "./OptionsPanel";
import { PreviewStage } from "./PreviewStage";

export function CustomizeWorkspace() {
  const {
    data,
    activeCategory,
    nav,
    isSaved,
    selectCategory,
    selectOption,
    goBack,
    goForward,
    restore,
    reset,
    save,
  } = useCustomization();

  const summary = buildSummary(data.selections);

  return (
    <div className="flex h-screen overflow-hidden bg-[#07060d] text-zinc-100">
      <IconRail />
      <CategoryPanel
        data={data}
        activeCategory={activeCategory}
        isSaved={isSaved}
        onSelectCategory={selectCategory}
        onSave={save}
        onReset={reset}
      />

      <main className="flex min-w-0 flex-1 flex-col">
        <TopBar isSaved={isSaved} />

        <div className="flex-1 overflow-y-auto px-6 pb-4">
          <PreviewStage
            data={data}
            nav={nav}
            onBack={goBack}
            onForward={goForward}
            onRestore={restore}
          />
          <OptionsPanel
            data={data}
            activeCategory={activeCategory}
            onSelectOption={selectOption}
          />
        </div>

        <BuildSummaryBar count={summary.count} total={summary.total} />
      </main>
    </div>
  );
}

function IconRail() {
  const items = [
    { icon: HomeIcon, label: "Home", href: "/" },
    { icon: ImageIcon, label: "Gallery" },
    { icon: UserIcon, label: "Community" },
    { icon: TargetIcon, label: "Discover" },
    { icon: DownloadIcon, label: "Saved" },
    { icon: BookmarkIcon, label: "Bookmarks" },
  ];

  return (
    <aside className="flex w-16 flex-col items-center justify-between border-white/5 border-r bg-[#0a0912] py-4">
      <div className="flex flex-col items-center gap-6">
        <Link href="/" aria-label="Garage AI home">
          <Image
            src="/assets/logo-01.png"
            alt="Garage AI"
            width={36}
            height={36}
            className="h-9 w-9"
          />
        </Link>
        <nav className="flex flex-col items-center gap-2">
          {items.map((item, index) => {
            const Icon = item.icon;
            const className = `flex h-10 w-10 items-center justify-center rounded-xl transition ${
              index === 0
                ? "bg-violet-500/15 text-violet-300"
                : "text-zinc-500 hover:bg-white/5 hover:text-white"
            }`;
            return item.href ? (
              <Link
                key={item.label}
                href={item.href}
                aria-label={item.label}
                className={className}
              >
                <Icon className="h-5 w-5" />
              </Link>
            ) : (
              <button
                key={item.label}
                type="button"
                aria-label={item.label}
                className={className}
              >
                <Icon className="h-5 w-5" />
              </button>
            );
          })}
        </nav>
      </div>

      <div className="flex flex-col items-center gap-4">
        <button
          type="button"
          aria-label="Settings"
          className="flex h-10 w-10 items-center justify-center rounded-xl text-zinc-500 transition hover:bg-white/5 hover:text-white"
        >
          <SettingsIcon className="h-5 w-5" />
        </button>
        <span className="relative h-9 w-9 rounded-full bg-gradient-to-br from-violet-500 to-blue-500">
          <span className="absolute right-0 bottom-0 h-2.5 w-2.5 rounded-full border-2 border-[#0a0912] bg-emerald-400" />
        </span>
      </div>
    </aside>
  );
}

function TopBar({ isSaved }: { isSaved: boolean }) {
  return (
    <header className="flex items-center justify-between px-6 py-4">
      <div className="flex items-center gap-3">
        <span className="flex items-center gap-2 font-semibold text-lg">
          My Build
          <ChevronDownIcon className="h-4 w-4 text-zinc-500" />
        </span>
        {isSaved ? (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 font-medium text-emerald-400 text-xs">
            <CheckIcon className="h-3 w-3" />
            Saved
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 font-medium text-amber-400 text-xs">
            Unsaved changes
          </span>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 font-medium text-sm text-zinc-300 transition hover:bg-white/10"
        >
          <CompareIcon className="h-4 w-4" />
          Compare
        </button>
        <button
          type="button"
          className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-violet-600 to-blue-500 px-4 py-2 font-medium text-sm text-white shadow-lg shadow-violet-900/30 transition hover:opacity-90"
        >
          <DownloadIcon className="h-4 w-4" />
          Download
          <ArrowRightIcon className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}

function BuildSummaryBar({ count, total }: { count: number; total: number }) {
  return (
    <footer className="flex items-center justify-between gap-4 border-white/5 border-t bg-[#0a0912] px-6 py-4">
      <div className="flex items-center gap-2 text-sm">
        <span className="font-semibold">Build Summary</span>
        <span className="text-violet-400">
          {count} {count === 1 ? "Item" : "Items"} Added
        </span>
      </div>
      <div className="flex items-center gap-5">
        <div className="text-right">
          <p className="text-[11px] text-zinc-500">Estimated Total</p>
          <p className="font-bold text-xl">${total.toLocaleString()}</p>
        </div>
        <button
          type="button"
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-blue-500 px-6 py-3 font-medium text-sm text-white shadow-lg shadow-violet-900/30 transition hover:opacity-90"
        >
          View Build
          <ArrowRightIcon className="h-4 w-4" />
        </button>
      </div>
    </footer>
  );
}

function buildSummary(selections: CombinationSelections): {
  count: number;
  total: number;
} {
  let count = 0;
  let total = 0;

  for (const category of CATEGORY_ORDER) {
    const option = findOption(category, selections[category]);
    if (option) {
      count += 1;
      total += option.price;
    }
  }

  return { count, total };
}
