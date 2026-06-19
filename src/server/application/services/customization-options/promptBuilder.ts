import { getPlanLimits } from "@/server/domain/plan/plan-mode";
import type { GenerateCustomizationOptionsInput } from "./types";

/**
 * System prompt: establishes the model as a domain expert and pins the output
 * contract. Kept separate from the user prompt so behavior tuning and content
 * tuning can evolve independently.
 */
export function buildSystemPrompt(): string {
  return [
    "You are a senior automotive customization specialist for a visual car",
    "customization platform. Users pick options and an image-editing model",
    "applies each one to a photo of their car — so every recommendation must",
    "produce a change that is clearly visible in an exterior car photo.",
    "",
    "You have deep knowledge of global car culture: JDM, Euro, Muscle,",
    "Supercar, Track, Drift, and Stance scenes, including their iconic eras,",
    "communities, and the aftermarket brands each scene reveres.",
    "",
    "Your recommendations must be vehicle-aware: tailor every option to the",
    "specific car's style, culture, era, and enthusiast community. Prioritize",
    "iconic, respected, and popular real-world aftermarket brands and products",
    "over generic suggestions. Avoid parts that do not physically fit or suit",
    "the vehicle.",
    "",
    "Never suggest hidden or mechanical-only upgrades (coilovers, springs,",
    "ECU tunes, brake pads, exhaust internals, etc.) unless the category is",
    "about a visible outcome such as ride height or stance. Focus on exterior",
    "equipment and finishes users can see: wheels, paint, body kits, aero,",
    "lighting, and similar.",
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
  planMode,
}: GenerateCustomizationOptionsInput): string {
  const categoryList = categories.map((c) => `"${c}"`).join(", ");
  const optionsPerCategory = getPlanLimits(planMode).optionsPerCategory;

  return [
    `Vehicle: ${car}`,
    `Categories: [${categoryList}]`,
    "",
    "For the vehicle above, generate aftermarket customization options for each",
    "of the requested categories.",
    "",
    "This is an image customization app: every option will be applied to a car",
    "photo. Only suggest modifications whose result is visible from typical",
    "exterior angles. Do not list parts that stay hidden under the body or",
    "inside the car.",
    "",
    "Requirements:",
    `- Generate options for EXACTLY these ${categories.length} categories.`,
    `- Provide EXACTLY ${optionsPerCategory} options per category.`,
    "- Rank options from most relevant (rank 1) to least relevant, and order",
    "  the array to match the ranking.",
    "- Every option must describe a visible change in the photo. Exclude",
    "  mechanical-only upgrades (e.g. coilovers, lowering springs, dampers,",
    "  bushings, brake kits hidden behind wheels) unless you frame them by their",
    "  visible outcome.",
    '- For "suspension", recommend stance/ride-height looks only — e.g. stock',
    "  height, mild drop, aggressive slam, or lifted — not invisible hardware.",
    "- Recommendations must fit this exact vehicle's style, era, culture, and",
    "  enthusiast community.",
    "- Prefer real-world brands and specific products when the part itself is",
    "  visible (wheels, body kits, wings, lights). Use the manufacturer in the",
    '  "brand" field and the product/part name in the "name" field.',
    "- Different scenes (JDM, Euro, Muscle, Supercar, Track, Drift, Stance)",
    "  must receive scene-appropriate parts.",
    '- "description" should mention what the viewer sees on the car, not internal',
    "  specs or install details.",
    '- "visualDescription" must be a concise, purely visual phrase describing how',
    "  the car looks once the modification is applied (shape, finish, color,",
    "  ride height, gap between tire and fender). It is fed directly to an",
    "  image-editing model, so avoid brand names and non-visual marketing",
    '  language. Example: "bronze 6-spoke forged wheels with a deep concave',
    '  face and polished lip" or "slammed stance with minimal wheel gap and a',
    '  tucked fitment".',
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
