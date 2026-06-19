import { integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { STARTING_CREDITS } from "@/server/domain/credits/credits";
import { DEFAULT_PLAN_MODE } from "@/server/domain/plan/plan-mode";

/**
 * Application users. `planMode` carries the user's plan privileges (see
 * {@link import("@/server/domain/plan/plan-mode").PlanMode}); it is stored as a
 * plain text column so new plans can be added without a schema migration.
 */
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  password: text("password"),
  image: text("image"),
  provider: text("provider"),
  providerId: text("provider_id"),
  planMode: text("plan_mode").notNull().default(DEFAULT_PLAN_MODE),
  credits: integer("credits").notNull().default(STARTING_CREDITS),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type UserRow = typeof users.$inferSelect;
export type NewUserRow = typeof users.$inferInsert;
