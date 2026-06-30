"use client";

import { type CreditsBenefit, CreditsDialog } from "@/features/credits";
import { CREDITS_PER_CATEGORY } from "../core/credits/credits";

type UpgradeDialogProps = {
  open: boolean;
  /**
   * Current build id, round-tripped through checkout to resume the session.
   * Absent on the settings page, where there is no active build.
   */
  buildId?: string | null;
  onClose: () => void;
};

const BENEFITS: CreditsBenefit[] = [
  {
    title: "Unlock more categories",
    description:
      "Generate options across your whole build — wheels, paint, hood and beyond.",
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
 * Buy-credits dialog for the customize flow — surfaced automatically a while
 * after a free user starts customizing, when they run out of credits mid-build,
 * and when they try a top-up-only action such as downloading. A thin wrapper
 * around the shared {@link CreditsDialog} with build-specific copy; checkout
 * opens in a new tab so the in-progress build is preserved.
 */
export function UpgradeDialog({ open, buildId, onClose }: UpgradeDialogProps) {
  return (
    <CreditsDialog
      open={open}
      onClose={onClose}
      buildId={buildId}
      title="Top up your credits"
      subtitle="Buy credits to keep modifying your build."
      benefits={BENEFITS}
    />
  );
}
