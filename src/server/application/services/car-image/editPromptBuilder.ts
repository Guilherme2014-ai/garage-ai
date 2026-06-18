export interface CarEditEquipment {
  /** The part/option name, e.g. "TE37 Saga". */
  name: string;
  /** Visual description of how the part looks installed, fed to the model. */
  visualDescription: string;
}

/**
 * Builds the prompt for the car image modification model.
 *
 * The caller never supplies a raw prompt: it provides the equipment name and
 * its visual description, and this builder wraps them in a prepared template so
 * prompt wording stays centralized and consistent.
 */
export function buildCarEditPrompt({
  name,
  visualDescription,
}: CarEditEquipment): string {
  const equipment = visualDescription ? `${name}: ${visualDescription}` : name;

  return [
    "You are a car modification image model that edits an existing photo of a car.",
    "",
    `- Replace or add the following car equipment: "${equipment}".`,
    "- Apply this modification on top of the car's current state, preserving every",
    "  modification already present in the image.",
    "- Edit ONLY the region that the requested equipment occupies. Every other",
    "  pixel of the image must remain untouched and identical to the original —",
    "  treat the rest of the photo as locked. Do not regenerate, restyle, recolor,",
    "  or subtly alter any area outside the equipment, no matter how minor.",
    "- Keep the same car identity, body, camera angle, perspective, framing,",
    "  lighting, and background. Only change what the requested equipment affects.",
    "- Install the equipment in its correct, real-world location on the car,",
    "  determined by the part itself — NOT by what is currently visible in the",
    "  photo. For example, a rear spoiler always goes on the rear, a front",
    "  splitter on the front, side skirts on the sides.",
    "- Respect the photo's viewpoint and occlusion. If the area the equipment",
    "  belongs to is not visible or is only partially visible from this angle,",
    "  apply it there anyway and only show whatever would realistically be seen",
    "  (it may be barely visible or not visible at all). Never relocate, rotate,",
    "  duplicate, or resize the part to force it into view, and never place it on",
    "  the wrong side of the car just because that side faces the camera.",
    "- Produce a photorealistic result consistent with the original photo.",
  ].join("\n");
}
