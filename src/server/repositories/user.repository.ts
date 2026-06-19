import { and, eq, gte, sql } from "drizzle-orm";
import type { UserEntity } from "@/server/domain/entities";
import {
  DEFAULT_PLAN_MODE,
  isPlanMode,
  type PlanMode,
} from "@/server/domain/plan/plan-mode";
import { db } from "@/server/infrastructure/database/db";
import {
  type NewUserRow,
  processedStripeEvents,
  type UserRow,
  users,
} from "@/server/infrastructure/database/schema";

/** Maps a raw `users` row into the domain {@link UserEntity}. */
function toEntity(row: UserRow): UserEntity {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    password: row.password,
    image: row.image,
    provider: row.provider,
    providerId: row.providerId,
    planMode: isPlanMode(row.planMode) ? row.planMode : DEFAULT_PLAN_MODE,
    credits: row.credits,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export const userRepository = {
  async findAll(): Promise<UserEntity[]> {
    const rows = await db.select().from(users);
    return rows.map(toEntity);
  },

  async findByEmail(email: string): Promise<UserEntity | null> {
    const [row] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    return row ? toEntity(row) : null;
  },

  async findById(id: string): Promise<UserEntity | null> {
    const [row] = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    return row ? toEntity(row) : null;
  },

  async findByProviderId(
    provider: string,
    providerId: string,
  ): Promise<UserEntity | null> {
    const [row] = await db
      .select()
      .from(users)
      .where(
        and(eq(users.provider, provider), eq(users.providerId, providerId)),
      )
      .limit(1);
    return row ? toEntity(row) : null;
  },

  async create(
    userData: Omit<
      UserEntity,
      "id" | "createdAt" | "updatedAt" | "planMode" | "credits"
    > & {
      planMode?: PlanMode;
    },
  ): Promise<UserEntity> {
    const values: NewUserRow = {
      email: userData.email,
      name: userData.name,
      password: userData.password,
      image: userData.image,
      provider: userData.provider,
      providerId: userData.providerId,
      ...(userData.planMode ? { planMode: userData.planMode } : {}),
    };
    const [row] = await db.insert(users).values(values).returning();
    return toEntity(row);
  },

  async update(
    id: string,
    userData: Partial<UserEntity>,
  ): Promise<UserEntity | null> {
    const changes: Partial<NewUserRow> = {};
    if (userData.email !== undefined) changes.email = userData.email;
    if (userData.name !== undefined) changes.name = userData.name;
    if (userData.password !== undefined) changes.password = userData.password;
    if (userData.image !== undefined) changes.image = userData.image;
    if (userData.provider !== undefined) changes.provider = userData.provider;
    if (userData.providerId !== undefined)
      changes.providerId = userData.providerId;
    if (userData.planMode !== undefined) changes.planMode = userData.planMode;
    changes.updatedAt = new Date();

    const [row] = await db
      .update(users)
      .set(changes)
      .where(eq(users.id, id))
      .returning();
    return row ? toEntity(row) : null;
  },

  async delete(id: string): Promise<boolean> {
    const deleted = await db
      .delete(users)
      .where(eq(users.id, id))
      .returning({ id: users.id });
    return deleted.length > 0;
  },

  /**
   * Atomically deducts `amount` credits, but only if the balance can cover it.
   * Returns the new balance, or `null` when the user has insufficient credits
   * (no row updated) — the `credits >= amount` guard keeps the check and the
   * decrement in a single statement so concurrent charges can't overspend.
   */
  async decrementCredits(id: string, amount: number): Promise<number | null> {
    const [row] = await db
      .update(users)
      .set({
        credits: sql`${users.credits} - ${amount}`,
        updatedAt: new Date(),
      })
      .where(and(eq(users.id, id), gte(users.credits, amount)))
      .returning({ credits: users.credits });
    return row ? row.credits : null;
  },

  /**
   * Grants a completed purchase exactly once for a given Stripe event. Records
   * the event id and tops up the buyer's credits (upgrading them to `top-up`)
   * in a single transaction, so a duplicate delivery hits the primary-key
   * conflict and returns `"duplicate"` without granting again. A missing user
   * is a no-op — the event is still recorded so Stripe stops retrying — while a
   * thrown error rolls the whole transaction back, letting the caller return a
   * 500 so Stripe retries cleanly.
   */
  async grantPurchaseOnce(params: {
    eventId: string;
    eventType: string;
    userId: string;
    credits: number;
    planMode: PlanMode;
  }): Promise<"granted" | "duplicate"> {
    const { eventId, eventType, userId, credits, planMode } = params;
    return db.transaction(async (tx) => {
      const [recorded] = await tx
        .insert(processedStripeEvents)
        .values({ eventId, type: eventType })
        .onConflictDoNothing()
        .returning({ eventId: processedStripeEvents.eventId });
      if (!recorded) {
        return "duplicate";
      }
      await tx
        .update(users)
        .set({
          credits: sql`${users.credits} + ${credits}`,
          planMode,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));
      return "granted";
    });
  },
};
