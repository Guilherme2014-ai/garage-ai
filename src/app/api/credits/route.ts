import { apiError, apiServerError, apiSuccess } from "@/lib/api/api-response";
import { requireAuthAPI } from "@/lib/auth/auth-utils";
import { creditsService, planService } from "@/server/application/services";
import { AppError } from "@/server/domain/errors";

/**
 * GET /api/credits
 *
 * Returns the signed-in user's current credit balance and plan mode. Used by
 * the workspace on mount, after a purchase returns, and by the settings page.
 */
export async function GET() {
  const { session, error } = await requireAuthAPI();
  if (error) return error;

  const userId = session.user?.id;
  if (!userId) {
    return apiError("Unable to resolve current account", 400);
  }

  try {
    const [credits, planMode] = await Promise.all([
      creditsService.getCredits(userId),
      planService.getPlanModeForUserId(userId),
    ]);
    return apiSuccess({ credits, planMode });
  } catch (err) {
    if (err instanceof AppError) {
      return apiError(err.message, err.statusCode, err.errorCode);
    }
    return apiServerError(err);
  }
}
