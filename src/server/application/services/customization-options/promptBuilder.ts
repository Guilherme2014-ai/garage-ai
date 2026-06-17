import type { GenerateCustomizationOptionsInput } from "./types";

/** Minimum number of options the model must return per category. */
export const MIN_OPTIONS_PER_CATEGORY = 8;

/** Maximum number of options kept per category. */
export const MAX_OPTIONS_PER_CATEGORY = 15;

/**
 * System prompt: establishes the model as a domain expert and pins the output
 * contract. Kept separate from the user prompt so behavior tuning and content
 * tuning can evolve independently.
 */
export function buildSystemPrompt(): string {
  return [
    "You are a senior automotive customization specialist for a racing and",
    "enthusiast-focused car modification platform. You have deep knowledge of",
    "global car culture: JDM, Euro, Muscle, Supercar, Track, Drift, and Stance",
    "scenes, including their iconic eras, communities, and the aftermarket",
    "brands each scene reveres.",
    "",
    "Your recommendations must be vehicle-aware: tailor every option to the",
    "specific car's style, culture, era, and enthusiast community. Prioritize",
    "iconic, respected, and popular real-world aftermarket brands and products",
    "over generic suggestions. Avoid parts that do not physically fit or suit",
    "the vehicle.",
    "",
    "You always respond with valid JSON only. No markdown, no code fences, no",
    "commentary, no explanation outside the JSON object.",
  ].join("\n");
}

/**
 * User prompt: injects the concrete vehicle + requested categories and the
 * exact JSON schema the model must return.
 */
export function buildUserPrompt({
  car,
  categories,
}: GenerateCustomizationOptionsInput): string {
  const categoryList = categories.map((c) => `"${c}"`).join(", ");

  return [
    `Vehicle: ${car}`,
    `Categories: [${categoryList}]`,
    "",
    "For the vehicle above, generate aftermarket customization options for each",
    "of the requested categories.",
    "",
    "Requirements:",
    `- Provide between ${MIN_OPTIONS_PER_CATEGORY} and ${MAX_OPTIONS_PER_CATEGORY} options per category (never fewer than ${MIN_OPTIONS_PER_CATEGORY}, never more than ${MAX_OPTIONS_PER_CATEGORY}).`,
    "- Rank options from most relevant (rank 1) to least relevant, and order",
    "  the array to match the ranking.",
    "- Recommendations must fit this exact vehicle's style, era, culture, and",
    "  enthusiast community.",
    "- Prefer real-world brands and specific products. Use the manufacturer in",
    '  the "brand" field and the product/part name in the "name" field.',
    "- Different scenes (JDM, Euro, Muscle, Supercar, Track, Drift, Stance)",
    "  must receive scene-appropriate parts.",
    '- "visualDescription" must be a concise, purely visual phrase describing how',
    "  the part looks once installed on the car (shape, finish, color, stance",
    "  effect). It is fed to an image-editing model, so avoid brand names and",
    '  non-visual marketing language. Example: "bronze 6-spoke forged wheels',
    '  with a deep concave face and polished lip".',
    '- "price" is a rough aftermarket price estimate in USD as an integer (use 0',
    "  only when the part is genuinely a no-cost/stock choice).",
    '- "colorHex" is OPTIONAL: include a representative hex color (e.g. "#1a1a1a")',
    "  when the part has a signature color, especially for paint/wrap options.",
    "",
    "Return ONLY a JSON object with this exact shape:",
    "{",
    '  "car": string,',
    '  "vehicleProfile": { "style": string, "era": string, "summary": string },',
    '  "categories": {',
    '    "<category>": [',
    "      {",
    '        "rank": number,',
    '        "name": string,',
    '        "brand": string,',
    '        "description": string,',
    '        "visualDescription": string,',
    '        "price": number,',
    '        "colorHex": string,',
    '        "tags": string[]',
    "      }",
    "    ]",
    "  }",
    "}",
    "",
    'The keys of the "categories" object must be exactly the requested',
    "categories. Output valid JSON only.",
  ].join("\n");
}
