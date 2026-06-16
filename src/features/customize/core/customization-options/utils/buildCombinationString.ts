/**
 * Serializes a combination into a stable, order-independent string used as the
 * canonical key for tracking and caching combinations.
 *
 * Example: `{ wheels: "rays", paint: "red" }` -> `"paint__red|wheels__rays"`.
 */
export function buildCombinationString<K extends string>(
  combination: Partial<Record<K, string>>,
): string {
  return Object.entries(combination)
    .filter(([, value]) => value !== undefined && value !== "")
    .map(([key, value]) => `${key}__${value}`)
    .sort()
    .join("|");
}
