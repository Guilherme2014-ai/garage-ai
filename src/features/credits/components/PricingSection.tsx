"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import {
  CREDIT_PACKS,
  CREDITS_PER_CATEGORY,
  type CreditPack,
  formatUsd,
  packReferencePriceUsd,
  packSavingsPercent,
} from "@/lib/credits/credits";
import { CreditsDialog } from "./CreditsDialog";
import { CheckIcon } from "./icons";

/**
 * Landing-page pricing section. Presents the credit packs with savings badges
 * and a clear recommended option, then funnels every CTA into the shared
 * {@link CreditsDialog} (which also surfaces the order bump). Signed-out visitors
 * are routed to sign in first.
 */
export function PricingSection() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  function openCheckout() {
    if (isAuthenticated) {
      setOpen(true);
      return;
    }
    if (isLoading) {
      return;
    }
    router.push(
      `/auth/signin?callbackUrl=${encodeURIComponent(pathname || "/")}`,
    );
  }

  return (
    <section id="pricing" className="mx-auto max-w-7xl px-6 py-16 sm:py-20">
      <p className="text-center font-semibold text-violet-400 text-xs tracking-[0.2em]">
        SIMPLE CREDIT PACKS
      </p>
      <h2 className="mt-3 text-center font-bold text-3xl tracking-tight sm:text-4xl">
        Pay once. Build as much as you want.
      </h2>
      <p className="mx-auto mt-3 max-w-xl text-center text-sm text-zinc-400">
        No subscriptions. Credits never expire. Each category modification costs{" "}
        {CREDITS_PER_CATEGORY} credits — bigger packs unlock the best value.
      </p>

      <div className="mt-12 grid items-stretch gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {CREDIT_PACKS.map((pack) => (
          <PricingCard key={pack.id} pack={pack} onSelect={openCheckout} />
        ))}
      </div>

      <p className="mt-6 text-center text-xs text-zinc-600">
        Secure one-time payment via Stripe · Instant delivery · Credits never
        expire
      </p>

      <CreditsDialog open={open} onClose={() => setOpen(false)} />
    </section>
  );
}

function PricingCard({
  pack,
  onSelect,
}: {
  pack: CreditPack;
  onSelect: () => void;
}) {
  const savings = packSavingsPercent(pack);
  const reference = packReferencePriceUsd(pack);

  const perks = [
    `${pack.credits} credits`,
    "Unlimited high-res downloads",
    "Credits never expire",
  ];

  return (
    <div
      className={`relative flex flex-col rounded-2xl border p-6 transition ${
        pack.highlight
          ? "border-violet-500/50 bg-gradient-to-b from-violet-600/15 to-blue-500/5 shadow-lg shadow-violet-900/20 lg:scale-[1.03]"
          : "border-white/10 bg-white/[0.02] hover:border-white/20"
      }`}
    >
      {pack.badge && (
        <span
          className={`-top-3 absolute left-6 rounded-full px-3 py-1 font-semibold text-[11px] uppercase tracking-wide shadow-sm ${
            pack.highlight
              ? "bg-gradient-to-r from-violet-600 to-blue-500 text-white"
              : "bg-emerald-500/20 text-emerald-300"
          }`}
        >
          {pack.badge}
        </span>
      )}

      <h3 className="font-semibold text-lg text-white">{pack.label}</h3>

      <div className="mt-3 flex items-end gap-2">
        <span className="font-extrabold text-4xl tracking-tight">
          ${formatUsd(pack.priceUsd)}
        </span>
        {savings > 0 && (
          <span className="mb-1 text-sm text-zinc-500 line-through">
            ${formatUsd(reference)}
          </span>
        )}
      </div>

      <div className="mt-1 flex items-center gap-2">
        <span className="font-medium text-sm text-violet-300">
          {pack.credits} credits
        </span>
        {savings > 0 && (
          <span className="rounded-md bg-emerald-500/15 px-1.5 py-0.5 font-semibold text-[10px] text-emerald-400">
            Save {savings}%
          </span>
        )}
      </div>

      <ul className="mt-5 flex-1 space-y-2.5">
        {perks.map((perk) => (
          <li key={perk} className="flex items-start gap-2.5 text-sm">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
              <CheckIcon className="h-3 w-3" />
            </span>
            <span className="text-zinc-300">{perk}</span>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={onSelect}
        className={`mt-6 w-full rounded-xl py-3 font-semibold text-sm transition ${
          pack.highlight
            ? "bg-gradient-to-r from-violet-600 to-blue-500 text-white shadow-lg shadow-violet-900/30 hover:opacity-90"
            : "border border-white/15 bg-white/5 text-zinc-100 hover:bg-white/10"
        }`}
      >
        Get {pack.credits} credits
      </button>
    </div>
  );
}
