/**
 * Server-side re-export of the canonical credits module. Keeps `@/server`
 * import paths stable and preserves the layer boundary (mirrors
 * `src/server/domain/plan/plan-mode.ts`).
 */
export * from "@/lib/credits/credits";
