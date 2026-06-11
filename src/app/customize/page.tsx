"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

type IconProps = { className?: string };

type Category = {
  id: string;
  label: string;
  count: number;
  icon: (props: IconProps) => React.ReactNode;
};

type WheelFinish =
  | "Matte Black"
  | "Silver"
  | "Bronze"
  | "Gloss Black"
  | "Gunmetal";

type Wheel = {
  id: string;
  name: string;
  size: string;
  finish: WheelFinish;
  price: number;
  style: "Forged" | "Sport" | "Classic" | "Off-Road";
};

const CATEGORIES: Category[] = [
  { id: "wheels", label: "Wheels", count: 12, icon: WheelIcon },
  { id: "paint", label: "Paint & Wraps", count: 24, icon: PaletteIcon },
  { id: "body", label: "Body Kits", count: 18, icon: CarIcon },
  { id: "spoilers", label: "Spoilers & Wings", count: 10, icon: SpoilerIcon },
  { id: "suspension", label: "Suspension", count: 8, icon: SuspensionIcon },
  { id: "lights", label: "Lights", count: 16, icon: LightIcon },
  { id: "brakes", label: "Brakes", count: 7, icon: BrakeIcon },
  { id: "exhaust", label: "Exhaust", count: 9, icon: ExhaustIcon },
  { id: "decals", label: "Decals & Graphics", count: 23, icon: DecalIcon },
  { id: "windows", label: "Windows", count: 6, icon: WindowIcon },
  { id: "interior", label: "Interior", count: 15, icon: InteriorIcon },
];

const WHEELS: Wheel[] = [
  {
    id: "vortex",
    name: "Vortex VR6",
    size: '19"',
    finish: "Matte Black",
    price: 0,
    style: "Forged",
  },
  {
    id: "elite",
    name: "Elite F1R",
    size: '19"',
    finish: "Silver",
    price: 1250,
    style: "Sport",
  },
  {
    id: "rays",
    name: "Rays TE37",
    size: '18"',
    finish: "Bronze",
    price: 1450,
    style: "Sport",
  },
  {
    id: "rotiform",
    name: "Rotiform RSE",
    size: '20"',
    finish: "Gloss Black",
    price: 1350,
    style: "Classic",
  },
  {
    id: "bbs",
    name: "BBS CI-R",
    size: '19"',
    finish: "Gunmetal",
    price: 1550,
    style: "Forged",
  },
  {
    id: "method",
    name: "Method MR701",
    size: '17"',
    finish: "Matte Black",
    price: 1100,
    style: "Off-Road",
  },
];

const WHEEL_FILTERS = [
  "All",
  "Forged",
  "Sport",
  "Classic",
  "Off-Road",
] as const;

const ANGLES = [
  "Front Left",
  "Front",
  "Front Right",
  "Side",
  "Rear Left",
  "Rear",
  "Rear Right",
];

const FINISH_COLORS: Record<WheelFinish, string> = {
  "Matte Black": "#3f3f46",
  Silver: "#cbd5e1",
  Bronze: "#b45309",
  "Gloss Black": "#18181b",
  Gunmetal: "#64748b",
};

export default function CustomizePage() {
  const [activeCategory, setActiveCategory] = useState("wheels");
  const [activeAngle, setActiveAngle] = useState("Front Left");
  const [wheelFilter, setWheelFilter] =
    useState<(typeof WHEEL_FILTERS)[number]>("All");
  const [selectedWheel, setSelectedWheel] = useState("vortex");

  const visibleWheels =
    wheelFilter === "All"
      ? WHEELS
      : WHEELS.filter((wheel) => wheel.style === wheelFilter);

  return (
    <div className="flex h-screen overflow-hidden bg-[#07060d] text-zinc-100">
      <IconRail />
      <CustomizationPanel
        activeCategory={activeCategory}
        onSelect={setActiveCategory}
      />

      <main className="flex min-w-0 flex-1 flex-col">
        <TopBar />

        <div className="flex-1 overflow-y-auto px-6 pb-4">
          <PreviewArea
            activeAngle={activeAngle}
            onSelectAngle={setActiveAngle}
          />
          <WheelsSection
            wheels={visibleWheels}
            filter={wheelFilter}
            onFilter={setWheelFilter}
            selectedWheel={selectedWheel}
            onSelectWheel={setSelectedWheel}
          />
        </div>

        <BuildSummaryBar />
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

function CustomizationPanel({
  activeCategory,
  onSelect,
}: {
  activeCategory: string;
  onSelect: (id: string) => void;
}) {
  return (
    <aside className="flex w-80 flex-col border-white/5 border-r bg-[#0a0912]">
      <div className="px-5 pt-5">
        <button
          type="button"
          className="flex items-center gap-2 text-left"
          aria-label="Back"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-zinc-300">
            <ArrowLeftIcon className="h-4 w-4" />
          </span>
          <span className="font-bold text-xl tracking-tight">
            Customization
          </span>
        </button>
        <p className="mt-1 ml-9 text-xs text-zinc-500">Make it yours ✨</p>
      </div>

      <div className="mt-4 flex-1 space-y-1.5 overflow-y-auto px-4 pb-4">
        {CATEGORIES.map((category) => {
          const Icon = category.icon;
          const isActive = category.id === activeCategory;
          return (
            <div key={category.id}>
              <button
                type="button"
                onClick={() => onSelect(category.id)}
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
                <span className="flex-1 font-medium text-sm">
                  {category.label}
                </span>
                <span className="text-xs text-zinc-500">{category.count}</span>
                <ChevronRightIcon className="h-4 w-4 text-zinc-600" />
              </button>

              {isActive && category.id === "wheels" && (
                <div className="mt-2 ml-1 rounded-xl border border-white/5 bg-white/[0.02] p-3">
                  <div className="grid grid-cols-3 gap-2">
                    {(["Matte Black", "Silver", "Bronze"] as WheelFinish[]).map(
                      (finish, index) => (
                        <button
                          key={finish}
                          type="button"
                          className={`flex aspect-square items-center justify-center rounded-lg border bg-[#0d0b16] ${
                            index === 0
                              ? "border-violet-500/60"
                              : "border-white/10"
                          }`}
                        >
                          <WheelGraphic
                            color={FINISH_COLORS[finish]}
                            size={44}
                          />
                        </button>
                      ),
                    )}
                  </div>
                  <button
                    type="button"
                    className="mt-2 w-full rounded-lg border border-white/10 bg-white/5 py-1.5 text-xs text-zinc-300 transition hover:bg-white/10"
                  >
                    See all
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="space-y-2 border-white/5 border-t p-4">
        <button
          type="button"
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-blue-500 py-3 font-medium text-sm text-white shadow-lg shadow-violet-900/30 transition hover:opacity-90"
        >
          <SaveIcon className="h-4 w-4" />
          Save Build
        </button>
        <button
          type="button"
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-3 font-medium text-sm text-zinc-300 transition hover:bg-white/10"
        >
          <ResetIcon className="h-4 w-4" />
          Reset All
        </button>
      </div>
    </aside>
  );
}

function TopBar() {
  return (
    <header className="flex items-center justify-between px-6 py-4">
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="flex items-center gap-2 font-semibold text-lg"
        >
          My Build
          <ChevronDownIcon className="h-4 w-4 text-zinc-500" />
        </button>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 font-medium text-emerald-400 text-xs">
          <CheckIcon className="h-3 w-3" />
          Saved
        </span>
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
          <ChevronRightIcon className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}

function PreviewArea({
  activeAngle,
  onSelectAngle,
}: {
  activeAngle: string;
  onSelectAngle: (angle: string) => void;
}) {
  return (
    <div>
      <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl border border-white/10">
        {/* Neon garage placeholder backdrop */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a1030] via-[#0d0b1a] to-[#05040a]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(168,85,247,0.35),transparent_55%),radial-gradient(circle_at_75%_70%,rgba(59,130,246,0.25),transparent_55%)]" />
        <div className="absolute inset-x-0 top-10 mx-auto h-1 w-2/3 rounded-full bg-violet-400/40 blur-md" />

        {/* Car placeholder */}
        <div className="absolute inset-0 flex items-center justify-center">
          <CarIcon className="h-40 w-40 text-white/15" />
        </div>
        <p className="absolute right-6 bottom-1/2 flex translate-y-1/2 items-center gap-1.5 font-bold text-2xl text-white/20 tracking-tight">
          Garage
          <span className="text-white/15">AI</span>
        </p>

        {/* Angle dropdown */}
        <button
          type="button"
          className="absolute top-4 left-4 flex items-center gap-2 rounded-lg border border-white/10 bg-black/50 px-3 py-1.5 font-medium text-sm text-zinc-200 backdrop-blur"
        >
          {activeAngle}
          <ChevronDownIcon className="h-4 w-4 text-zinc-400" />
        </button>

        {/* Controls */}
        <div className="absolute top-4 right-4 flex items-center gap-1.5">
          {[
            { icon: SunIcon, label: "Lighting" },
            { icon: RefreshIcon, label: "Reset view" },
            { icon: ExpandIcon, label: "Expand" },
            { icon: FullscreenIcon, label: "Fullscreen" },
          ].map(({ icon: Icon, label }) => (
            <button
              key={label}
              type="button"
              aria-label={label}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-black/50 text-zinc-300 backdrop-blur transition hover:bg-white/10"
            >
              <Icon className="h-4 w-4" />
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5">
        <p className="mb-3 font-semibold text-sm">Other Angles</p>
        <div className="flex gap-3 overflow-x-auto pb-1">
          {ANGLES.map((angle) => {
            const isActive = angle === activeAngle;
            return (
              <button
                key={angle}
                type="button"
                onClick={() => onSelectAngle(angle)}
                className={`group flex shrink-0 flex-col items-center gap-1.5 rounded-xl border p-2 transition ${
                  isActive
                    ? "border-violet-500/60 bg-violet-500/10"
                    : "border-white/10 bg-white/[0.02] hover:bg-white/5"
                }`}
              >
                <span className="flex h-12 w-24 items-center justify-center rounded-lg bg-gradient-to-br from-[#1a1030] to-[#05040a]">
                  <CarIcon className="h-7 w-7 text-rose-500/70" />
                </span>
                <span
                  className={`text-[11px] ${isActive ? "text-white" : "text-zinc-500"}`}
                >
                  {angle}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function WheelsSection({
  wheels,
  filter,
  onFilter,
  selectedWheel,
  onSelectWheel,
}: {
  wheels: Wheel[];
  filter: (typeof WHEEL_FILTERS)[number];
  onFilter: (filter: (typeof WHEEL_FILTERS)[number]) => void;
  selectedWheel: string;
  onSelectWheel: (id: string) => void;
}) {
  return (
    <section className="mt-6 rounded-2xl border border-white/5 bg-white/[0.02] p-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-lg">Wheels</h2>
          <p className="text-xs text-zinc-500">Choose your perfect style</p>
        </div>
        <button
          type="button"
          className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 font-medium text-xs text-zinc-300 transition hover:bg-white/10"
        >
          <CarIcon className="h-4 w-4" />
          View on Car
        </button>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {WHEEL_FILTERS.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => onFilter(item)}
            className={`rounded-full px-4 py-1.5 font-medium text-xs transition ${
              filter === item
                ? "bg-gradient-to-r from-violet-600 to-blue-500 text-white"
                : "border border-white/10 bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white"
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      <div className="mt-4 flex gap-4 overflow-x-auto pb-2">
        {wheels.map((wheel) => {
          const isSelected = wheel.id === selectedWheel;
          return (
            <button
              key={wheel.id}
              type="button"
              onClick={() => onSelectWheel(wheel.id)}
              className={`flex w-44 shrink-0 flex-col rounded-xl border p-4 text-left transition ${
                isSelected
                  ? "border-violet-500/60 bg-violet-500/10"
                  : "border-white/10 bg-[#0d0b16] hover:border-white/20"
              }`}
            >
              <span className="mx-auto mb-3 flex h-24 w-24 items-center justify-center">
                <WheelGraphic color={FINISH_COLORS[wheel.finish]} size={96} />
              </span>
              <span className="font-semibold text-sm">{wheel.name}</span>
              <span className="mt-0.5 text-[11px] text-zinc-500">
                {wheel.size} • {wheel.finish}
              </span>
              <span className="mt-2">
                {isSelected ? (
                  <span className="inline-flex rounded-md bg-gradient-to-r from-violet-600 to-blue-500 px-2 py-0.5 font-medium text-[11px] text-white">
                    Selected
                  </span>
                ) : (
                  <span className="font-semibold text-sm text-violet-300">
                    ${wheel.price.toLocaleString()}
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function BuildSummaryBar() {
  return (
    <footer className="flex items-center justify-between gap-4 border-white/5 border-t bg-[#0a0912] px-6 py-4">
      <div className="flex items-center gap-2 text-sm">
        <span className="font-semibold">Build Summary</span>
        <span className="text-violet-400">8 Items Added</span>
      </div>
      <div className="flex items-center gap-5">
        <div className="text-right">
          <p className="text-[11px] text-zinc-500">Estimated Total</p>
          <p className="font-bold text-xl">$8,750</p>
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

function WheelGraphic({ color, size }: { color: string; size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      aria-hidden="true"
      role="img"
    >
      <defs>
        <radialGradient id={`tire-${color}`} cx="50%" cy="50%" r="50%">
          <stop offset="70%" stopColor="#111114" />
          <stop offset="100%" stopColor="#000" />
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="48" fill={`url(#tire-${color})`} />
      <circle cx="50" cy="50" r="34" fill={color} opacity="0.95" />
      <circle
        cx="50"
        cy="50"
        r="34"
        fill="none"
        stroke="#000"
        strokeOpacity="0.3"
        strokeWidth="1"
      />
      {[0, 72, 144, 216, 288].map((deg) => {
        const angle = (deg * Math.PI) / 180;
        const x = 50 + Math.cos(angle) * 22;
        const y = 50 + Math.sin(angle) * 22;
        return (
          <line
            key={deg}
            x1="50"
            y1="50"
            x2={x}
            y2={y}
            stroke="#000"
            strokeOpacity="0.45"
            strokeWidth="4"
            strokeLinecap="round"
          />
        );
      })}
      <circle cx="50" cy="50" r="8" fill="#0a0a0a" />
      <circle cx="50" cy="50" r="3" fill={color} />
    </svg>
  );
}

/* ---------------------------------- Icons --------------------------------- */

function ArrowLeftIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m12 19-7-7 7-7" />
      <path d="M19 12H5" />
    </svg>
  );
}

function ArrowRightIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}

function ChevronRightIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

function ChevronDownIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function CheckIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function HomeIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <path d="M9 22V12h6v10" />
    </svg>
  );
}

function ImageIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
    </svg>
  );
}

function UserIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function TargetIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}

function BookmarkIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function SettingsIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function DownloadIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <path d="m7 10 5 5 5-5" />
      <path d="M12 15V3" />
    </svg>
  );
}

function CompareIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m16 3 4 4-4 4" />
      <path d="M20 7H4" />
      <path d="m8 21-4-4 4-4" />
      <path d="M4 17h16" />
    </svg>
  );
}

function SaveIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" />
      <path d="M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7" />
      <path d="M7 3v4a1 1 0 0 0 1 1h7" />
    </svg>
  );
}

function ResetIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
    </svg>
  );
}

function SunIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="m4.93 4.93 1.41 1.41" />
      <path d="m17.66 17.66 1.41 1.41" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="m6.34 17.66-1.41 1.41" />
      <path d="m19.07 4.93-1.41 1.41" />
    </svg>
  );
}

function RefreshIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
      <path d="M8 16H3v5" />
    </svg>
  );
}

function ExpandIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M15 3h6v6" />
      <path d="M9 21H3v-6" />
      <path d="M21 3l-7 7" />
      <path d="M3 21l7-7" />
    </svg>
  );
}

function FullscreenIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M8 3H5a2 2 0 0 0-2 2v3" />
      <path d="M21 8V5a2 2 0 0 0-2-2h-3" />
      <path d="M3 16v3a2 2 0 0 0 2 2h3" />
      <path d="M16 21h3a2 2 0 0 0 2-2v-3" />
    </svg>
  );
}

function WheelIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3v6" />
      <path d="m18.5 8-5 3.5" />
      <path d="m18.5 16-5-3.5" />
      <path d="M5.5 8l5 3.5" />
      <path d="m5.5 16 5-3.5" />
    </svg>
  );
}

function PaletteIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="13.5" cy="6.5" r=".5" fill="currentColor" />
      <circle cx="17.5" cy="10.5" r=".5" fill="currentColor" />
      <circle cx="8.5" cy="7.5" r=".5" fill="currentColor" />
      <circle cx="6.5" cy="12.5" r=".5" fill="currentColor" />
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
    </svg>
  );
}

function CarIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
      <circle cx="7" cy="17" r="2" />
      <path d="M9 17h6" />
      <circle cx="17" cy="17" r="2" />
    </svg>
  );
}

function SpoilerIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 8h18" />
      <path d="M5 8v3" />
      <path d="M19 8v3" />
      <path d="M2 16c4-2 16-2 20 0" />
    </svg>
  );
}

function SuspensionIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 3v3" />
      <path d="M12 18v3" />
      <path d="m8 7 8 2" />
      <path d="m8 11 8 2" />
      <path d="m8 15 8 2" />
    </svg>
  );
}

function LightIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
      <path d="M9 18h6" />
      <path d="M10 22h4" />
    </svg>
  );
}

function BrakeIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v3" />
      <path d="M12 19v3" />
    </svg>
  );
}

function ExhaustIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 12h11a3 3 0 0 1 3 3v1" />
      <circle cx="19.5" cy="16.5" r="2.5" />
      <path d="M3 9v6" />
    </svg>
  );
}

function DecalIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 2 2 7l10 5 10-5z" />
      <path d="m2 17 10 5 10-5" />
      <path d="m2 12 10 5 10-5" />
    </svg>
  );
}

function WindowIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect width="18" height="18" x="3" y="3" rx="2" />
      <path d="M3 9h18" />
      <path d="M9 21V9" />
    </svg>
  );
}

function InteriorIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 19v-3a4 4 0 0 1 4-4h2" />
      <path d="M10 12V7a3 3 0 0 1 6 0v1" />
      <path d="M10 12h8a2 2 0 0 1 2 2v5" />
      <path d="M4 19h16" />
    </svg>
  );
}
