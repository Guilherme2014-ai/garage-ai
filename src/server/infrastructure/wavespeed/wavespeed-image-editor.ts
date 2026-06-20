import { Client } from "wavespeed";
import { runWithWaveSpeedLimit } from "./wavespeed-concurrency";

const MODEL = "google/nano-banana-2/edit";

export interface EditImageOptions {
  prompt: string;
  imageUrls: string[];
  outputFormat?: "png" | "jpeg" | "webp";
  resolution?: "0.5k" | "1k" | "2k" | "4k";
  aspectRatio?: "3:2" | "1:1" | "4:3" | "9:16";
}

/**
 * Thin wrapper around the WaveSpeed SDK for the nano-banana image-edit model.
 *
 * The SDK reads `WAVESPEED_API_KEY` from the environment automatically.
 */
export async function editImage({
  prompt,
  imageUrls,
  outputFormat = "png",
  resolution = "0.5k",
  aspectRatio = "3:2",
}: EditImageOptions): Promise<string> {
  const client = new Client();

  const result = await runWithWaveSpeedLimit(() =>
    client.run(MODEL, {
      enable_base64_output: false,
      enable_image_search: false,
      enable_sync_mode: false,
      enable_web_search: false,
      images: imageUrls,
      aspect_ratio: aspectRatio,
      output_format: outputFormat,
      prompt,
      resolution,
    }),
  );

  const outputUrl = result.outputs?.[0];
  if (typeof outputUrl !== "string" || !outputUrl) {
    throw new Error("WaveSpeed returned no output image");
  }

  return outputUrl;
}
