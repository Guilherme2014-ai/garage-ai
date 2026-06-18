import type {
  EditCarImageInput,
  EditCarImageResult,
} from "./car-image.service";

/** Placeholder car image returned for every mocked preview/edit. */
export const MOCK_PREVIEW_IMAGE_URL =
  "https://media.istockphoto.com/id/1273534607/vector/car-icon-auto-vehicle-isolated-transport-icons-automobile-silhouette-front-view-sedan-car.jpg?s=612x612&w=0&k=20&c=hpl9DfPNZ4EquzqsiVPmq1828pkFv0KkdkesxKdLk2Y=";

/** Simulated latency so the UI still shows a brief generating state. */
const MOCK_EDIT_DELAY_MS = 400;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
let count = 0;
/**
 * Returns a static placeholder image instead of calling the WaveSpeed edit
 * model. Used when `MOCK_AI_CALLS` is enabled to avoid spending API credits.
 *
 * No Blob upload happens here: the source URL echoes the provided `imageUrl`
 * (or falls back to the placeholder), so no external services are touched.
 */
export async function generateMockEdit(
  input: EditCarImageInput,
): Promise<EditCarImageResult> {
  await delay(MOCK_EDIT_DELAY_MS);

  console.log("generateMockEdit", count++);

  return {
    imageUrl: MOCK_PREVIEW_IMAGE_URL,
    sourceUrl: input.imageUrl?.trim() || MOCK_PREVIEW_IMAGE_URL,
  };
}
