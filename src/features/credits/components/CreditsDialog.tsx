"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  bumpReferencePriceUsd,
  bumpSavingsPercent,
  CREDIT_BUMP,
  CREDIT_PACKS,
  type CreditPackId,
  formatUsd,
  getCreditPack,
  packReferencePriceUsd,
  packSavingsPercent,
} from "@/lib/credits/credits";
import { startCreditCheckout } from "../api/checkout";
import {
  ArrowRightIcon,
  BoltIcon,
  CheckIcon,
  SparkleIcon,
  XIcon,
} from "./icons";

export type CreditsBenefit = { title: string; description: string };

export type CreditsDialogProps = {
  open: boolean;
  onClose: () => void;
  /**
   * Current build id, round-tripped through checkout to resume the session.
   * Absent outside the customize workspace (e.g. the nav/home dialog).
   */
  buildId?: string | null;
  title?: string;
  subtitle?: string;
  benefits?: CreditsBenefit[];
};

const DEFAULT_BENEFITS: CreditsBenefit[] = [
  {
    title: "Unlock every category",
    description:
      "Generate wheels, paint, hood and more across your whole build.",
  },
  {
    title: "Unlimited high-res downloads",
    description: "Save and share every render you create.",
  },
  {
    title: "Credits never expire",
    description: "Use them whenever inspiration strikes — no subscription.",
  },
];

/** The pack pre-selected when the dialog opens (the recommended one). */
const DEFAULT_PACK_ID: CreditPackId =
  CREDIT_PACKS.find((pack) => pack.highlight)?.id ?? CREDIT_PACKS[0].id;

/**
 * Shared buy-credits modal used everywhere credits are sold (the customize
 * workspace, settings, nav and landing page). Buyers pick a pack, optionally add
 * the discounted order bump, and see a live total before checking out. Checkout
 * opens in a new tab so any in-progress build is preserved; callers refresh the
 * balance when the user returns.
 */
export function CreditsDialog({
  open,
  onClose,
  buildId,
  title = "Fuel your next build",
  subtitle = "Pick a pack — bigger packs unlock bigger savings.",
  benefits = DEFAULT_BENEFITS,
}: CreditsDialogProps) {
  const [selectedPack, setSelectedPack] =
    useState<CreditPackId>(DEFAULT_PACK_ID);
  const [bumpChecked, setBumpChecked] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset to a clean, recommended-pack state each time the dialog opens.
  useEffect(() => {
    if (open) {
      setSelectedPack(DEFAULT_PACK_ID);
      setBumpChecked(false);
      setError(null);
      setPending(false);
    }
  }, [open]);

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

  const pack = getCreditPack(selectedPack) ?? CREDIT_PACKS[0];
  const totalPrice = pack.priceUsd + (bumpChecked ? CREDIT_BUMP.priceUsd : 0);
  const totalCredits = pack.credits + (bumpChecked ? CREDIT_BUMP.credits : 0);

  async function handleCheckout() {
    setError(null);
    setPending(true);
    try {
      const url = await startCreditCheckout(selectedPack, {
        buildId,
        bump: bumpChecked,
      });
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not start checkout.",
      );
    } finally {
      setPending(false);
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Buy credits"
    >
      <button
        type="button"
        aria-label="Close"
        className="fixed inset-0 cursor-default"
        onClick={onClose}
      />

      <div className="flex min-h-full justify-center p-4">
        <div className="slim-scrollbar relative my-auto flex w-full max-w-md flex-col rounded-3xl border border-white/10 bg-[#0a0912]">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute top-4 right-4 z-10 flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-zinc-400 transition hover:bg-white/10"
          >
            <XIcon className="h-4 w-4" />
          </button>

          <div className="px-6 pt-7 pb-3 text-center">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-blue-500 text-white shadow-lg shadow-violet-900/30">
              <SparkleIcon className="h-6 w-6" />
            </span>
            <h2 className="mt-4 font-bold text-xl tracking-tight">{title}</h2>
            <p className="mt-1.5 text-sm text-zinc-400">{subtitle}</p>
          </div>

          <div className="mx-6 mb-1 flex items-center justify-center gap-2 rounded-xl border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-amber-300 text-xs">
            <BoltIcon className="h-3.5 w-3.5" />
            <span className="font-medium">
              Limited-time bonus pricing — extra credits on every pack.
            </span>
          </div>

          {benefits.length > 0 && (
            <div className="space-y-2.5 px-6 py-4">
              {benefits.map((benefit) => (
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
          )}

          <div className="space-y-2.5 px-6 pt-1">
            {CREDIT_PACKS.map((option) => (
              <PackCard
                key={option.id}
                packId={option.id}
                selected={option.id === selectedPack}
                onSelect={() => setSelectedPack(option.id)}
              />
            ))}
          </div>

          <div className="px-6 pt-3">
            <OrderBumpCard
              checked={bumpChecked}
              onToggle={() => setBumpChecked((v) => !v)}
            />
          </div>

          <div className="mt-3 space-y-2.5 border-white/5 border-t bg-[#0a0912] px-6 pt-3 pb-6">
            {error && (
              <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-center text-red-300 text-xs">
                {error}
              </p>
            )}

            <button
              type="button"
              disabled={pending}
              onClick={handleCheckout}
              className="group flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-blue-500 py-3.5 font-semibold text-sm text-white shadow-lg shadow-violet-900/30 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pending ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <>
                  Continue — ${formatUsd(totalPrice)}
                  <ArrowRightIcon className="h-4 w-4 transition group-hover:translate-x-0.5" />
                </>
              )}
            </button>

            <p className="text-center text-[11px] text-zinc-500">
              {totalCredits} credits
            </p>
            <p className="flex items-center justify-center gap-1.5 text-center text-[11px] text-zinc-600">
              <LockIcon className="h-3 w-3" />
              Secure one-time payment via Stripe · Credits never expire
            </p>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function PackCard({
  packId,
  selected,
  onSelect,
}: {
  packId: CreditPackId;
  selected: boolean;
  onSelect: () => void;
}) {
  const pack = getCreditPack(packId);
  if (!pack) {
    return null;
  }

  const savings = packSavingsPercent(pack);
  const reference = packReferencePriceUsd(pack);

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`relative flex w-full items-center gap-3 rounded-xl border px-4 py-3.5 text-left transition ${
        selected
          ? "border-violet-500/70 bg-violet-500/10 ring-1 ring-violet-500/40"
          : pack.highlight
            ? "border-violet-500/40 bg-white/[0.03] hover:border-violet-500/60"
            : "border-white/10 bg-white/[0.03] hover:border-white/20"
      }`}
    >
      {pack.badge && (
        <span className="-top-2.5 absolute right-4 rounded-full bg-gradient-to-r from-violet-600 to-blue-500 px-2 py-0.5 font-semibold text-[10px] text-white uppercase tracking-wide shadow-sm">
          {pack.badge}
        </span>
      )}

      <span
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
          selected
            ? "border-violet-400 bg-violet-500 text-white"
            : "border-white/25 bg-transparent"
        }`}
      >
        {selected && <CheckIcon className="h-3 w-3" />}
      </span>

      <span className="flex min-w-0 flex-1 flex-col">
        <span className="flex items-baseline gap-2">
          <span className="font-semibold text-base text-white">
            {pack.credits} credits
          </span>
          {savings > 0 && (
            <span className="rounded-md bg-emerald-500/15 px-1.5 py-0.5 font-semibold text-[10px] text-emerald-400">
              Save {savings}%
            </span>
          )}
        </span>
      </span>

      <span className="flex shrink-0 flex-col items-end">
        <span className="font-bold text-base text-white">
          ${formatUsd(pack.priceUsd)}
        </span>
        {savings > 0 && (
          <span className="text-[11px] text-zinc-500 line-through">
            ${formatUsd(reference)}
          </span>
        )}
      </span>
    </button>
  );
}

function OrderBumpCard({
  checked,
  onToggle,
}: {
  checked: boolean;
  onToggle: () => void;
}) {
  const savings = bumpSavingsPercent();
  const reference = bumpReferencePriceUsd();

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={checked}
      className={`flex w-full items-start gap-3 rounded-xl border-2 border-dashed px-4 py-3.5 text-left transition ${
        checked
          ? "border-amber-400/70 bg-amber-500/10"
          : "border-amber-500/40 bg-amber-500/[0.06] hover:border-amber-400/60"
      }`}
    >
      <span
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
          checked
            ? "border-amber-400 bg-amber-400 text-[#1a1206]"
            : "border-amber-400/60 bg-transparent"
        }`}
      >
        {checked && <CheckIcon className="h-3 w-3" />}
      </span>

      <span className="flex min-w-0 flex-1 flex-col">
        <span className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span className="font-semibold text-sm text-amber-100">
            Yes! {CREDIT_BUMP.label}
          </span>
          <span className="font-bold text-amber-200 text-sm">
            +${formatUsd(CREDIT_BUMP.priceUsd)}
          </span>
          {savings > 0 && (
            <span className="rounded-md bg-amber-400/20 px-1.5 py-0.5 font-semibold text-[10px] text-amber-200">
              ${formatUsd(reference)} value · save {savings}%
            </span>
          )}
        </span>
        <span className="mt-0.5 text-[11px] text-amber-200/70">
          {CREDIT_BUMP.description}
        </span>
      </span>
    </button>
  );
}

function LockIcon({ className }: { className?: string }) {
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
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}
