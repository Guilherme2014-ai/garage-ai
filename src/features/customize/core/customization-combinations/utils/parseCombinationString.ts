export function parseCombinationString<K extends string>(combinationString: string): Record<K, string> {
  return combinationString
    .split("|")
    .map((item) => {
      const [key, value] = item.split("__");
      return { [key as K]: value };
    })
    .reduce((acc, curr) => {
      return Object.assign(acc, curr);
    }, {}) as Record<K, string>;
}
