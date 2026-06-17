import { customizationOptionsService } from "@/server/application/services";
import type { GenerateCustomizationOptionsInput } from "@/server/application/services/customization-options/types";

export async function generateCustomizationOptions(
  input: GenerateCustomizationOptionsInput,
) {
  return customizationOptionsService.generateOptions(input);
}
