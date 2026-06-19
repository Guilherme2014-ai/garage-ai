import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

/**
 * Returns the configured Postgres connection string, failing fast with a clear
 * message when it is missing. Mirrors the env-guard style of
 * {@link import("@/server/config/ai-mock")}.
 */
function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Add it to your environment to connect to Postgres.",
    );
  }
  return url;
}

// Reuse a single client across hot reloads in development to avoid exhausting
// connections (Next.js re-evaluates modules on each change).
const globalForDb = globalThis as unknown as {
  __pgClient?: ReturnType<typeof postgres>;
};

const client = globalForDb.__pgClient ?? postgres(getDatabaseUrl());
if (process.env.NODE_ENV !== "production") {
  globalForDb.__pgClient = client;
}

export const db = drizzle(client, { schema });
