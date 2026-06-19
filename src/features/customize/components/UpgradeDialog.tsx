"use client";

import { useEffect, useState } from "react";
import { startCreditCheckout } from "../api/creditsApi";
import {
  CREDIT_PACKS,
  CREDITS_PER_CATEGORY,
  type CreditPackId,
} from "../core/credits/credits";
import { CheckIcon, SparkleIcon, XIcon } from "./icons";

type UpgradeDialogProps = {
  open: boolean;
  onClose: () => void;
};

const BENEFITS = [
  {
    title: "Unlock 5 categories",
    description: "Generate options across more of your build, not just a few.",
  },
  {
    title: "Modify more categories",
    description: `Each category modification costs ${CREDITS_PER_CATEGORY} credits.`,
  },
  {
    title: "Unlimited downloads",
    description: "Save and share high-res images of every build you create.",
  },
];

/**
 * Buy-credits dialog — surfaced automatically a while after a free user starts
 * customizing, when they run out of credits mid-build, and when they try a
 * top-up-only action such as downloading. Checkout opens in a new tab so the
 * in-progress build is preserved; the workspace refreshes the balance when the
 * user returns.
 */
export function UpgradeDialog({ open, onClose }: UpgradeDialogProps) {
  const [pending, setPending] = useState<CreditPackId | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  async function handleBuy(pack: CreditPackId) {
    setError(null);
    setPending(pack);
    try {
      const url = await startCreditCheckout(pack);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not start checkout.",
      );
    } finally {
      setPending(null);
    }
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
            Top up your credits
          </h2>
          <p className="mt-1.5 text-sm text-zinc-400">
            Buy credits to keep modifying your build.
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
          {CREDIT_PACKS.map((pack) => (
            <button
              key={pack.id}
              type="button"
              disabled={pending !== null}
              onClick={() => handleBuy(pack.id)}
              className="flex w-full items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-left transition hover:border-violet-500/40 hover:bg-violet-500/10 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span className="flex flex-col">
                <span className="font-semibold text-sm text-white">
                  {pack.credits} credits
                </span>
                <span className="text-xs text-zinc-500">
                  {Math.floor(pack.credits / CREDITS_PER_CATEGORY)} category
                  modifications
                </span>
              </span>
              <span className="flex items-center gap-2">
                <span className="font-semibold text-sm text-violet-200">
                  {pack.priceLabel ?? `$${pack.priceUsd}`}
                </span>
                {pending === pack.id && (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                )}
              </span>
            </button>
          ))}

          {error && (
            <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-center text-red-300 text-xs">
              {error}
            </p>
          )}

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
