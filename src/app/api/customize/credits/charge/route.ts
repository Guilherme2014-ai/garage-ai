import { apiError, apiServerError, apiSuccess } from "@/lib/api/api-response";
import { requireAuthAPI } from "@/lib/auth/auth-utils";
import { creditsService } from "@/server/application/services";
import { AppError } from "@/server/domain/errors";

/**
 * POST /api/customize/credits/charge
 *
 * Charges the signed-in user for one category modification (5 credits). Called
 * by the workspace the first time a category's previews are generated in a
 * build. Returns the new balance, or 402 (`INSUFFICIENT_CREDITS`) when the user
 * can't cover the cost — the client then opens the buy-credits dialog instead
 * of generating previews.
 */
export async function POST() {
  const { session, error } = await requireAuthAPI();
  if (error) return error;

  const userId = session.user?.id;
  if (!userId) {
    return apiError("Unable to resolve current account", 400);
  }

  try {
    const credits = await creditsService.chargeForCategory(userId);
    return apiSuccess({ credits });
  } catch (err) {
    if (err instanceof AppError) {
      return apiError(err.message, err.statusCode, err.errorCode);
    }
    return apiServerError(err);
  }
}
