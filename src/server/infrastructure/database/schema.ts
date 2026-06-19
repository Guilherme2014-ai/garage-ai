import {
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
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

/**
 * Saved customization sessions ("builds"). `state` holds the full serialized
 * session (current state + history + caches) — the customize feature's
 * `BuildSnapshot` — stored as opaque `jsonb` so the domain shape can evolve
 * without a schema migration. A build is deleted with its owning user.
 */
export const builds = pgTable("builds", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  carName: text("car_name").notNull(),
  baseImageUrl: text("base_image_url").notNull(),
  state: jsonb("state").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type BuildRow = typeof builds.$inferSelect;
export type NewBuildRow = typeof builds.$inferInsert;
