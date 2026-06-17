import { carImageService } from "@/server/application/services";
import type { EditCarImageInput } from "@/server/application/services/car-image/car-image.service";

export async function editCarImage(input: EditCarImageInput) {
  return carImageService.editCarImage(input);
}
