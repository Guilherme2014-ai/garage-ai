/**
 * Inverse of {@link buildCombinationString}. Rebuilds the selections map from a
 * combination string. An empty string maps to an empty combination.
 */
export function parseCombinationString<K extends string>(
  combinationString: string,
): Partial<Record<K, string>> {
  if (!combinationString) {
    return {};
  }

  return combinationString
    .split("|")
    .reduce<Partial<Record<K, string>>>((acc, item) => {
      const [key, value] = item.split("__");
      if (key) {
        acc[key as K] = value;
      }
      return acc;
    }, {});
}
