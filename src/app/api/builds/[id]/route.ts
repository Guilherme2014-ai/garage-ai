import { apiError, apiServerError, apiSuccess } from "@/lib/api/api-response";
import { requireAuthAPI } from "@/lib/auth/auth-utils";
import { buildService } from "@/server/application/services";
import { AppError } from "@/server/domain/errors";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * GET /api/builds/[id]
 *
 * Returns a single saved build (including its full serialized `state`) for the
 * owner. Used to resume a session — e.g. when landing on `/customize?build=<id>`
 * after returning from Stripe checkout.
 */
export async function GET(_request: Request, { params }: RouteContext) {
  const { session, error } = await requireAuthAPI();
  if (error) return error;

  const userId = session.user?.id;
  if (!userId) {
    return apiError("Unable to resolve current account", 400);
  }

  const { id } = await params;

  try {
    const build = await buildService.getBuild(userId, id);
    return apiSuccess(build);
  } catch (err) {
    if (err instanceof AppError) {
      return apiError(err.message, err.statusCode, err.errorCode);
    }
    return apiServerError(err);
  }
}

/**
 * PUT /api/builds/[id]
 *
 * Persists the latest session state for an existing build. Body:
 * `{ state, carName? }`. Called by the workspace autosave and the explicit
 * "Save Build" action.
 */
export async function PUT(request: Request, { params }: RouteContext) {
  const { session, error } = await requireAuthAPI();
  if (error) return error;

  const userId = session.user?.id;
  if (!userId) {
    return apiError("Unable to resolve current account", 400);
  }

  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("Expected a JSON request body", 400);
  }

  const { state, carName } = (body ?? {}) as {
    state?: unknown;
    carName?: unknown;
  };

  try {
    const build = await buildService.updateBuild(userId, id, {
      state,
      carName: typeof carName === "string" ? carName : undefined,
    });
    return apiSuccess(build);
  } catch (err) {
    if (err instanceof AppError) {
      return apiError(err.message, err.statusCode, err.errorCode);
    }
    return apiServerError(err);
  }
}

/**
 * DELETE /api/builds/[id]
 *
 * Deletes a saved build owned by the signed-in user.
 */
export async function DELETE(_request: Request, { params }: RouteContext) {
  const { session, error } = await requireAuthAPI();
  if (error) return error;

  const userId = session.user?.id;
  if (!userId) {
    return apiError("Unable to resolve current account", 400);
  }

  const { id } = await params;

  try {
    await buildService.deleteBuild(userId, id);
    return apiSuccess({ id });
  } catch (err) {
    if (err instanceof AppError) {
      return apiError(err.message, err.statusCode, err.errorCode);
    }
    return apiServerError(err);
  }
}
