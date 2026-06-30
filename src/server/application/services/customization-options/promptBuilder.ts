import type { PlanMode } from "@/server/domain/plan/plan-mode";
import { getPlanLimits } from "@/server/domain/plan/plan-mode";
import { MANDATORY_CATEGORIES } from "./categories";

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

export interface UserPromptInput {
  car: string;
  planMode: PlanMode;
}

/**
 * User prompt: injects the concrete vehicle and the exact JSON schema the model
 * must return. The model chooses the customization categories itself (vehicle-
 * aware), constrained only by how many the plan allows; the backend does not
 * dictate the category set.
 */
export function buildUserPrompt({ car, planMode }: UserPromptInput): string {
  const { categoriesCount: maxCategories, optionsPerCategory } =
    getPlanLimits(planMode);

  const mandatory = MANDATORY_CATEGORIES;
  const mandatoryList = mandatory.map((slug) => `"${slug}"`).join(", ");
  const remaining = Math.max(maxCategories - mandatory.length, 0);

  return [
    `Vehicle: ${car}`,
    "",
    "For the vehicle above, decide which aftermarket customization categories",
    "are the most relevant for THIS specific car, then generate options within",
    "each. Beyond the required categories below, choose the rest yourself based",
    "on the vehicle's style, era, and enthusiast scene — do NOT rely on a fixed",
    "or generic list for those.",
    "",
    "This is an image customization app: every option will be applied to a car",
    "photo. Only choose categories and modifications whose result is visible from",
    "typical exterior angles. Do not include parts that stay hidden under the",
    "body or inside the car.",
    "",
    "Requirements:",
    `- ALWAYS include these required categories FIRST, in this exact order using`,
    `  these exact slugs: ${mandatoryList}. "wheels" = aftermarket wheels/rims,`,
    `  "paint" = paint colors/wraps/finishes, "hood" = the hood/bonnet (e.g.`,
    "  carbon-fiber, vented, scooped, or contrasting-finish hoods).",
    remaining > 0
      ? `- Then choose ${remaining} MORE categories most relevant to this car, for a total of EXACTLY ${maxCategories}, ordered most relevant first.`
      : `- Return EXACTLY these ${maxCategories} required categories and no others.`,
    "- Each category key must be a short, lowercase slug: 1-2 words, words joined",
    '  by single hyphens, no spaces or punctuation (e.g. "wheels", "paint",',
    '  "body-kits", "lighting", "spoilers", "ride-height").',
    "- Categories must be distinct — each a visibly different kind of exterior",
    "  modification, with no overlap or duplicates.",
    "- If you include a stance/ride-height category, recommend looks only (stock",
    "  height, mild drop, aggressive slam, lifted) — not invisible hardware.",
    `- Provide EXACTLY ${optionsPerCategory} options per category.`,
    "- Rank options from most relevant (rank 1) to least relevant, and order",
    "  the array to match the ranking.",
    "- Every option must describe a visible change in the photo. Exclude",
    "  mechanical-only upgrades (e.g. coilovers, lowering springs, dampers,",
    "  bushings, brake kits hidden behind wheels) unless you frame them by their",
    "  visible outcome.",
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
    '    "<category-slug>": [',
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
    `The "categories" object must have EXACTLY ${maxCategories} keys — the category`,
    "slugs you selected for this vehicle. Output valid JSON only.",
  ].join("\n");
}
