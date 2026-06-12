import { apiError, apiServerError, apiSuccess } from "@/lib/api/api-response";
import { requireAuthAPI } from "@/lib/auth/auth-utils";
import { authService } from "@/server/application/services/auth.service";
import { AppError } from "@/server/domain/errors";

export async function GET() {
  const { session, error } = await requireAuthAPI();
  if (error) return error;

  const email = session.user?.email;
  if (!email) {
    return apiError("Unable to resolve current account", 400);
  }

  try {
    const user = await authService.getUserByEmail(email);
    if (!user) {
      return apiError("Account not found", 404);
    }
    return apiSuccess(user);
  } catch (err) {
    if (err instanceof AppError) {
      return apiError(err.message, err.statusCode, err.errorCode);
    }
    return apiServerError(err);
  }
}

export async function PATCH(request: Request) {
  const { session, error } = await requireAuthAPI();
  if (error) return error;

  const email = session.user?.email;
  if (!email) {
    return apiError("Unable to resolve current account", 400);
  }

  try {
    const body = await request.json();
    const { name } = body;

    if (typeof name !== "string" || !name.trim()) {
      return apiError("Name is required", 400);
    }

    const user = await authService.updateProfile(email, { name });
    return apiSuccess(user);
  } catch (err) {
    if (err instanceof AppError) {
      return apiError(err.message, err.statusCode, err.errorCode);
    }
    return apiServerError(err);
  }
}
