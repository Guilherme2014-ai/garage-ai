import { apiError, apiServerError, apiSuccess } from "@/lib/api/api-response";
import { requireAuthAPI } from "@/lib/auth/auth-utils";
import { buildService } from "@/server/application/services";
import type { BuildEntity } from "@/server/domain/entities";
import { AppError } from "@/server/domain/errors";

/** Lightweight build metadata (no heavy `state` blob) for listings. */
function toBuildMeta(build: BuildEntity) {
  return {
    id: build.id,
    carName: build.carName,
    baseImageUrl: build.baseImageUrl,
    createdAt: build.createdAt,
    updatedAt: build.updatedAt,
  };
}

/**
 * GET /api/builds
 *
 * Lists the signed-in user's saved builds (metadata only — the full serialized
 * session is fetched per build via `GET /api/builds/[id]`), newest first.
 */
export async function GET() {
  const { session, error } = await requireAuthAPI();
  if (error) return error;

  const userId = session.user?.id;
  if (!userId) {
    return apiError("Unable to resolve current account", 400);
  }

  try {
    const builds = await buildService.listBuilds(userId);
    return apiSuccess({ builds: builds.map(toBuildMeta) });
  } catch (err) {
    if (err instanceof AppError) {
      return apiError(err.message, err.statusCode, err.errorCode);
    }
    return apiServerError(err);
  }
}

/**
 * POST /api/builds
 *
 * Creates a saved build from the current customization session. Body:
 * `{ carName, baseImageUrl, state }` where `state` is the serialized
 * `BuildSnapshot`. Returns the created build (including its `id`, which the
 * client stores in the `?build=` URL param).
 */
export async function POST(request: Request) {
  const { session, error } = await requireAuthAPI();
  if (error) return error;

  const userId = session.user?.id;
  if (!userId) {
    return apiError("Unable to resolve current account", 400);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("Expected a JSON request body", 400);
  }

  const { carName, baseImageUrl, state } = (body ?? {}) as {
    carName?: unknown;
    baseImageUrl?: unknown;
    state?: unknown;
  };

  try {
    const build = await buildService.createBuild(userId, {
      carName: carName as string,
      baseImageUrl: baseImageUrl as string,
      state,
    });
    return apiSuccess(build, 201);
  } catch (err) {
    if (err instanceof AppError) {
      return apiError(err.message, err.statusCode, err.errorCode);
    }
    return apiServerError(err);
  }
}
