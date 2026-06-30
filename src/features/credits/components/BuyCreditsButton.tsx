"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { CreditsDialog } from "./CreditsDialog";
import { SparkleIcon } from "./icons";

type Variant = "nav" | "primary" | "secondary";

type BuyCreditsButtonProps = {
  variant?: Variant;
  label?: string;
  className?: string;
  /** Hide the leading sparkle icon (e.g. tight nav layouts). */
  hideIcon?: boolean;
};

const VARIANT_CLASSES: Record<Variant, string> = {
  nav: "rounded-lg border border-violet-500/40 bg-violet-500/10 px-3.5 py-2 font-medium text-sm text-violet-100 hover:bg-violet-500/20",
  primary:
    "rounded-lg bg-gradient-to-r from-violet-600 to-blue-500 px-5 py-2.5 font-semibold text-sm text-white shadow-lg shadow-violet-900/30 hover:opacity-90",
  secondary:
    "rounded-lg border border-white/15 bg-white/5 px-5 py-2.5 font-medium text-sm text-zinc-100 hover:bg-white/10",
};

/**
 * Opens the shared {@link CreditsDialog} for signed-in users, or routes signed-out
 * users to sign in first (checkout is auth-gated) before returning to this page.
 * Drop it anywhere credits should be purchasable — nav, hero, pricing, etc.
 */
export function BuyCreditsButton({
  variant = "primary",
  label = "Buy Credits",
  className = "",
  hideIcon = false,
}: BuyCreditsButtonProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  function handleClick() {
    if (isAuthenticated) {
      setOpen(true);
      return;
    }
    if (isLoading) {
      return;
    }
    const callback = encodeURIComponent(pathname || "/");
    router.push(`/auth/signin?callbackUrl=${callback}`);
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className={`inline-flex items-center justify-center gap-2 transition ${VARIANT_CLASSES[variant]} ${className}`}
      >
        {!hideIcon && <SparkleIcon className="h-4 w-4" />}
        {label}
      </button>

      <CreditsDialog open={open} onClose={() => setOpen(false)} />
    </>
  );
}
