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
    "- Keep the same car identity, body, camera angle, perspective, framing,",
    "  lighting, and background. Only change what the requested equipment affects.",
    "- Produce a photorealistic result consistent with the original photo.",
  ].join("\n");
}
