import {
  CREDITS_PER_CATEGORY,
  type CreditPack,
} from "@/server/domain/credits/credits";
import { InsufficientCreditsError } from "@/server/domain/errors";
import { userRepository } from "@/server/repositories";

/**
 * Owns the credits economy: reading balances, charging category modifications,
 * and applying purchases. Plans live alongside credits on the user row (see
 * {@link import("./plan.service").planService}); a purchase tops up credits and
 * upgrades the buyer to `top-up`.
 */
export const creditsService = {
  /** Current balance for a user (0 when the user can't be found). */
  async getCredits(userId: string): Promise<number> {
    const user = await userRepository.findById(userId);
    return user?.credits ?? 0;
  },

  /**
   * Charges one category modification. Returns the new balance, or throws
   * {@link InsufficientCreditsError} when the user can't cover the cost. The
   * decrement is atomic and guarded server-side, so this is the authoritative
   * spend check.
   */
  async chargeForCategory(userId: string): Promise<number> {
    const balance = await userRepository.decrementCredits(
      userId,
      CREDITS_PER_CATEGORY,
    );
    if (balance === null) {
      throw new InsufficientCreditsError(
        `You need ${CREDITS_PER_CATEGORY} credits to modify a category.`,
      );
    }
    return balance;
  },

  /**
   * Applies a completed purchase: adds the pack's credits and upgrades the
   * buyer to `top-up`. Safe to no-op if the user no longer exists.
   */
  async grantPurchase(userId: string, pack: CreditPack): Promise<void> {
    await userRepository.addCredits(userId, pack.credits, "top-up");
  },
};
