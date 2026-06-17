import { apiError, apiServerError, apiSuccess } from "@/lib/api/api-response";
import { requireAuthAPI } from "@/lib/auth/auth-utils";
import type { EditCarImageInput } from "@/server/application/services/car-image/car-image.service";
import { editCarImage } from "@/server/application/use-cases/edit-car-image/editCarImage";
import { AppError } from "@/server/domain/errors";

type OutputFormat = "png" | "jpeg" | "webp";
type Resolution = "1k" | "2k" | "4k";

const OUTPUT_FORMATS: OutputFormat[] = ["png", "jpeg", "webp"];
const RESOLUTIONS: Resolution[] = ["1k", "2k", "4k"];

function asOutputFormat(value: unknown): OutputFormat | undefined {
  return OUTPUT_FORMATS.includes(value as OutputFormat)
    ? (value as OutputFormat)
    : undefined;
}

function asResolution(value: unknown): Resolution | undefined {
  return RESOLUTIONS.includes(value as Resolution)
    ? (value as Resolution)
    : undefined;
}

/**
 * POST /api/customize/edit
 *
 * Applies a single customization to a car image. The prompt is built
 * server-side from the option `name` + `visualDescription`.
 *
 * Two request shapes are supported:
 *  - JSON: `{ imageUrl, name, visualDescription, outputFormat?, resolution? }`
 *    (used by the customization flow, stacking on the current image URL)
 *  - multipart/form-data: `image` (File) + `name` + `visualDescription`
 *
 * Responds with `{ imageUrl, sourceUrl }`.
 */
export async function POST(request: Request) {
  const { error } = await requireAuthAPI();
  if (error) return error;

  const contentType = request.headers.get("content-type") ?? "";

  let input: EditCarImageInput;
  try {
    input = contentType.includes("application/json")
      ? await parseJsonBody(request)
      : await parseFormBody(request);
  } catch (err) {
    if (err instanceof AppError) {
      return apiError(err.message, err.statusCode, err.errorCode);
    }
    return apiError("Invalid request body", 400);
  }

  if (!input.name?.trim()) {
    return apiError("An equipment name is required", 400);
  }

  if (!input.imageUrl && !input.image) {
    return apiError("An image URL or image file is required", 400);
  }

  try {
    const result = await editCarImage(input);
    return apiSuccess(result, 201);
  } catch (err) {
    if (err instanceof AppError) {
      return apiError(err.message, err.statusCode, err.errorCode);
    }
    return apiServerError(err);
  }
}

async function parseJsonBody(request: Request): Promise<EditCarImageInput> {
  const body = (await request.json()) as Record<string, unknown>;
  return {
    imageUrl: typeof body.imageUrl === "string" ? body.imageUrl : undefined,
    name: typeof body.name === "string" ? body.name : "",
    visualDescription:
      typeof body.visualDescription === "string" ? body.visualDescription : "",
    outputFormat: asOutputFormat(body.outputFormat),
    resolution: asResolution(body.resolution),
  };
}

async function parseFormBody(request: Request): Promise<EditCarImageInput> {
  const formData = await request.formData();
  const image = formData.get("image");
  const name = formData.get("name");
  const visualDescription = formData.get("visualDescription");

  return {
    image: image instanceof File ? image : undefined,
    name: typeof name === "string" ? name : "",
    visualDescription:
      typeof visualDescription === "string" ? visualDescription : "",
    outputFormat: asOutputFormat(formData.get("outputFormat")),
    resolution: asResolution(formData.get("resolution")),
  };
}
