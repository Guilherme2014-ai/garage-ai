import { and, desc, eq } from "drizzle-orm";
import type { BuildEntity } from "@/server/domain/entities";
import { db } from "@/server/infrastructure/database/db";
import {
  type BuildRow,
  builds,
  type NewBuildRow,
} from "@/server/infrastructure/database/schema";

/** Maps a raw `builds` row into the domain {@link BuildEntity}. */
function toEntity(row: BuildRow): BuildEntity {
  return {
    id: row.id,
    userId: row.userId,
    carName: row.carName,
    baseImageUrl: row.baseImageUrl,
    state: row.state,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export const buildRepository = {
  async create(data: {
    userId: string;
    carName: string;
    baseImageUrl: string;
    state: unknown;
  }): Promise<BuildEntity> {
    const values: NewBuildRow = {
      userId: data.userId,
      carName: data.carName,
      baseImageUrl: data.baseImageUrl,
      state: data.state,
    };
    const [row] = await db.insert(builds).values(values).returning();
    return toEntity(row);
  },

  async findById(id: string): Promise<BuildEntity | null> {
    const [row] = await db
      .select()
      .from(builds)
      .where(eq(builds.id, id))
      .limit(1);
    return row ? toEntity(row) : null;
  },

  /** Builds owned by a user, most recently updated first. */
  async findByUserId(userId: string): Promise<BuildEntity[]> {
    const rows = await db
      .select()
      .from(builds)
      .where(eq(builds.userId, userId))
      .orderBy(desc(builds.updatedAt));
    return rows.map(toEntity);
  },

  /**
   * Updates a build's serialized state (and optionally its car name), scoped to
   * the owner so a non-owner can never write to it. Returns the updated build,
   * or `null` when no matching row exists.
   */
  async update(
    id: string,
    userId: string,
    changes: { state?: unknown; carName?: string },
  ): Promise<BuildEntity | null> {
    const set: Partial<NewBuildRow> = { updatedAt: new Date() };
    if (changes.state !== undefined) set.state = changes.state;
    if (changes.carName !== undefined) set.carName = changes.carName;

    const [row] = await db
      .update(builds)
      .set(set)
      .where(and(eq(builds.id, id), eq(builds.userId, userId)))
      .returning();
    return row ? toEntity(row) : null;
  },

  async delete(id: string, userId: string): Promise<boolean> {
    const deleted = await db
      .delete(builds)
      .where(and(eq(builds.id, id), eq(builds.userId, userId)))
      .returning({ id: builds.id });
    return deleted.length > 0;
  },
};
