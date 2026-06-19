"use client";

import { useEffect } from "react";
import { CheckIcon, SparkleIcon, XIcon } from "./icons";

type UpgradeDialogProps = {
  open: boolean;
  onClose: () => void;
};

const BENEFITS = [
  {
    title: "More modifications",
    description: "Unlock every customization category, not just the first few.",
  },
  {
    title: "More equipment options",
    description: "Get the full set of curated parts for each category.",
  },
  {
    title: "Unlimited downloads",
    description: "Save and share high-res images of every build you create.",
  },
];

/**
 * Friendly upsell shown to free-plan users — surfaced automatically a while
 * after they start customizing, and when they try a top-up-only action such as
 * downloading. Billing isn't wired up yet, so the CTA is a placeholder.
 */
export function UpgradeDialog({ open, onClose }: UpgradeDialogProps) {
  useEffect(() => {
    if (!open) {
      return;
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-sm sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Add credits"
    >
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
      />

      <div className="relative flex w-full max-w-md flex-col overflow-hidden rounded-t-3xl border border-white/10 bg-[#0a0912] sm:rounded-3xl">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-zinc-400 transition hover:bg-white/10"
        >
          <XIcon className="h-4 w-4" />
        </button>

        <div className="px-6 pt-7 pb-2 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-blue-500 text-white shadow-lg shadow-violet-900/30">
            <SparkleIcon className="h-6 w-6" />
          </span>
          <h2 className="mt-4 font-bold text-xl tracking-tight">
            Unlock the full garage
          </h2>
          <p className="mt-1.5 text-sm text-zinc-400">
            Add credits to take your build further.
          </p>
        </div>

        <div className="space-y-2.5 px-6 py-4">
          {BENEFITS.map((benefit) => (
            <div key={benefit.title} className="flex items-start gap-3">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
                <CheckIcon className="h-3.5 w-3.5" />
              </span>
              <span className="flex min-w-0 flex-col">
                <span className="font-medium text-sm">{benefit.title}</span>
                <span className="text-xs text-zinc-500">
                  {benefit.description}
                </span>
              </span>
            </div>
          ))}
        </div>

        <div className="space-y-2 px-6 pt-2 pb-6">
          <button
            type="button"
            onClick={onClose}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-blue-500 py-3 font-semibold text-sm text-white shadow-lg shadow-violet-900/30 transition hover:opacity-90"
          >
            <SparkleIcon className="h-4 w-4" />
            Add credits
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl py-2.5 font-medium text-sm text-zinc-400 transition hover:text-zinc-200"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}
