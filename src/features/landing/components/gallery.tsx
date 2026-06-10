"use client";

import { useState } from "react";

type Category = "JDM" | "Euro" | "Muscle" | "Trucks" | "Exotics";

type Build = {
  handle: string;
  likes: string;
  category: Category;
  gradient: string;
};

const FILTERS = ["All", "JDM", "Euro", "Muscle", "Trucks", "Exotics"] as const;

const BUILDS: Build[] = [
  {
    handle: "@gearhead.tom",
    likes: "1.2K",
    category: "JDM",
    gradient: "from-slate-700 via-slate-800 to-slate-950",
  },
  {
    handle: "@jdm_visions",
    likes: "987",
    category: "JDM",
    gradient: "from-violet-700 via-purple-900 to-slate-950",
  },
  {
    handle: "@muscle.factory",
    likes: "1.5K",
    category: "Muscle",
    gradient: "from-amber-700 via-orange-900 to-slate-950",
  },
  {
    handle: "@offroad.king",
    likes: "843",
    category: "Trucks",
    gradient: "from-sky-700 via-slate-800 to-slate-950",
  },
  {
    handle: "@euro.spec",
    likes: "1.1K",
    category: "Euro",
    gradient: "from-blue-700 via-indigo-900 to-slate-950",
  },
  {
    handle: "@hyper.exotics",
    likes: "2.3K",
    category: "Exotics",
    gradient: "from-rose-700 via-fuchsia-900 to-slate-950",
  },
];

export function Gallery() {
  const [active, setActive] = useState<(typeof FILTERS)[number]>("All");

  const visible =
    active === "All"
      ? BUILDS
      : BUILDS.filter((build) => build.category === active);

  return (
    <div className="flex flex-col items-center">
      <div className="mb-10 flex flex-wrap items-center justify-center gap-2">
        {FILTERS.map((filter) => (
          <button
            key={filter}
            type="button"
            onClick={() => setActive(filter)}
            className={`rounded-full px-5 py-1.5 font-medium text-sm transition ${
              active === filter
                ? "bg-gradient-to-r from-violet-600 to-blue-500 text-white shadow-lg shadow-violet-900/30"
                : "border border-white/10 bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white"
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      <div className="grid w-full grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {visible.map((build) => (
          <div
            key={build.handle}
            className="group relative aspect-[4/5] overflow-hidden rounded-xl border border-white/10"
          >
            <div
              className={`absolute inset-0 bg-gradient-to-br ${build.gradient} transition duration-500 group-hover:scale-105`}
            />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(168,85,247,0.25),transparent_60%)]" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

            <span className="absolute top-3 left-3 rounded-md bg-black/50 px-2 py-0.5 font-medium text-[11px] text-white/80 backdrop-blur">
              {build.category}
            </span>

            <div className="absolute right-3 bottom-3 left-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-6 w-6 rounded-full bg-gradient-to-br from-violet-500 to-blue-500" />
                <span className="font-medium text-white text-xs">
                  {build.handle}
                </span>
              </div>
              <div className="flex items-center gap-1 text-white/90 text-xs">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="text-violet-400"
                  aria-hidden="true"
                >
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
                {build.likes}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
