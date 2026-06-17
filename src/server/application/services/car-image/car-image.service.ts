import { ValidationError } from "@/server/domain/errors";
import { uploadToBlob } from "@/server/infrastructure/storage/blob-storage";
import {
  type EditImageOptions,
  editImage,
} from "@/server/infrastructure/wavespeed/wavespeed-image-editor";
import { buildCarEditPrompt } from "./editPromptBuilder";

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];
const MAX_IMAGE_BYTES = 25 * 1024 * 1024; // 25MB

export interface EditCarImageInput {
  /**
   * Public URL of the car's current state. Preferred for the customization
   * flow, where each edit stacks on the previous AI-generated image.
   */
  imageUrl?: string;
  /** Source image as a file. Uploaded to Blob when no `imageUrl` is provided. */
  image?: File;
  /** Name of the equipment/option being applied, e.g. "TE37 Saga". */
  name: string;
  /** Visual description of the option, used to build the edit prompt. */
  visualDescription: string;
  outputFormat?: EditImageOptions["outputFormat"];
  resolution?: EditImageOptions["resolution"];
}

export interface EditCarImageResult {
  /** Public URL of the AI-modified car image (the new current state). */
  imageUrl: string;
  /** Public URL of the source image the edit was applied to. */
  sourceUrl: string;
}

function sanitizeFilename(name: string): string {
  const safe = name.replace(/[^a-zA-Z0-9._-]/g, "-");
  return safe || "car.png";
}

/**
 * Resolves the source image to a public URL, returning an optional cleanup for
 * any temporary upload created along the way.
 */
async function resolveSourceUrl(
  input: EditCarImageInput,
): Promise<{ url: string; cleanup?: () => Promise<void> }> {
  if (typeof input.imageUrl === "string" && input.imageUrl.trim()) {
    return { url: input.imageUrl.trim() };
  }

  if (input.image instanceof File && input.image.size > 0) {
    if (!ALLOWED_IMAGE_TYPES.includes(input.image.type)) {
      throw new ValidationError(
        "Unsupported image type. Use JPEG, PNG, or WebP",
      );
    }
    if (input.image.size > MAX_IMAGE_BYTES) {
      throw new ValidationError("Image exceeds the 25MB size limit");
    }

    const pathname = `car-customizations/${Date.now()}-${sanitizeFilename(
      input.image.name,
    )}`;
    const uploaded = await uploadToBlob(pathname, input.image);
    return { url: uploaded.url, cleanup: uploaded.delete };
  }

  throw new ValidationError("An image URL or image file is required");
}

export const carImageService = {
  /**
   * Uploads the user's base car photo to Blob storage and returns its public
   * URL. This becomes the starting "current state" for the customization flow.
   */
  async uploadBaseImage(image: File): Promise<{ url: string }> {
    if (!(image instanceof File) || image.size === 0) {
      throw new ValidationError("A valid image file is required");
    }
    if (!ALLOWED_IMAGE_TYPES.includes(image.type)) {
      throw new ValidationError(
        "Unsupported image type. Use JPEG, PNG, or WebP",
      );
    }
    if (image.size > MAX_IMAGE_BYTES) {
      throw new ValidationError("Image exceeds the 25MB size limit");
    }

    const pathname = `car-uploads/${Date.now()}-${sanitizeFilename(image.name)}`;
    const uploaded = await uploadToBlob(pathname, image);
    return { url: uploaded.url };
  },

  /**
   * Applies a single customization to the car image. The prompt is built
   * server-side from the option name + visual description; callers never pass a
   * raw prompt.
   */
  async editCarImage(input: EditCarImageInput): Promise<EditCarImageResult> {
    const name = input.name?.trim();
    if (!name) {
      throw new ValidationError("An equipment name is required");
    }

    const { url: sourceUrl, cleanup } = await resolveSourceUrl(input);

    try {
      const prompt = buildCarEditPrompt({
        name,
        visualDescription: input.visualDescription?.trim() ?? "",
      });

      const imageUrl = await editImage({
        prompt,
        imageUrls: [sourceUrl],
        outputFormat: input.outputFormat,
        resolution: input.resolution,
      });

      return { imageUrl, sourceUrl };
    } catch (error) {
      // Best-effort cleanup of any temporary upload if the edit fails.
      await cleanup?.().catch(() => undefined);
      throw error;
    }
  },
};
