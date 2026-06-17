import { carImageService } from "@/server/application/services";

export async function uploadCarImage(image: File) {
  return carImageService.uploadBaseImage(image);
}
