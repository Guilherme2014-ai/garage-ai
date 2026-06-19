import type { BuildEntity } from "@/server/domain/entities";
import { NotFoundError, ValidationError } from "@/server/domain/errors";
import { buildRepository } from "@/server/repositories";

export interface CreateBuildInput {
  carName: string;
  baseImageUrl: string;
  state: unknown;
}

export interface UpdateBuildInput {
  state?: unknown;
  carName?: string;
}

function requireNonEmptyString(value: unknown, field: string): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new ValidationError(`${field} is required`);
  }
  return value;
}

/** A build's serialized session must be a JSON object (the client snapshot). */
function requireStateObject(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new ValidationError("A build state object is required");
  }
  return value as Record<string, unknown>;
}

/**
 * Owns saved builds: creation, ownership-scoped reads/writes, and validation.
 * Every read/write is scoped to the requesting user, and a build the user
 * doesn't own is reported as {@link NotFoundError} so existence isn't leaked.
 */
export const buildService = {
  async createBuild(
    userId: string,
    input: CreateBuildInput,
  ): Promise<BuildEntity> {
    return buildRepository.create({
      userId,
      carName: requireNonEmptyString(input.carName, "Car name"),
      baseImageUrl: requireNonEmptyString(input.baseImageUrl, "Base image"),
      state: requireStateObject(input.state),
    });
  },

  async getBuild(userId: string, buildId: string): Promise<BuildEntity> {
    const build = await buildRepository.findById(buildId);
    if (!build || build.userId !== userId) {
      throw new NotFoundError("Build", buildId);
    }
    return build;
  },

  async listBuilds(userId: string): Promise<BuildEntity[]> {
    return buildRepository.findByUserId(userId);
  },

  async updateBuild(
    userId: string,
    buildId: string,
    input: UpdateBuildInput,
  ): Promise<BuildEntity> {
    const changes: UpdateBuildInput = {};
    if (input.state !== undefined) {
      changes.state = requireStateObject(input.state);
    }
    if (input.carName !== undefined) {
      changes.carName = requireNonEmptyString(input.carName, "Car name");
    }

    const updated = await buildRepository.update(buildId, userId, changes);
    if (!updated) {
      throw new NotFoundError("Build", buildId);
    }
    return updated;
  },

  async deleteBuild(userId: string, buildId: string): Promise<void> {
    const deleted = await buildRepository.delete(buildId, userId);
    if (!deleted) {
      throw new NotFoundError("Build", buildId);
    }
  },
};
