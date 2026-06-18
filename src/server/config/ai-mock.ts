/**
 * Central switch for mocking AI calls.
 *
 * When `MOCK_AI_CALLS` is truthy, the options-generation and image-edit services
 * return static mock data instead of calling WaveSpeed. This avoids spending API
 * credits during local development and testing.
 *
 * Accepted truthy values (case-insensitive): "true", "1", "yes", "on".
 */
const TRUTHY = new Set(["true", "1", "yes", "on"]);

export function isMockAiEnabled(): boolean {
  return TRUTHY.has((process.env.MOCK_AI_CALLS ?? "").trim().toLowerCase());
}
