export function buildCombinationString<K extends string>(combination: Record<K, string>) {
  return Object.entries(combination)
    .map(([key, value]) => `${key as K}__${value}`)
    .sort()
    .join("|");
}
