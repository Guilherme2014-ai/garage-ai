import { apiError, apiServerError, apiSuccess } from "@/lib/api/api-response";
import { requireAuthAPI } from "@/lib/auth/auth-utils";
import { uploadCarImage } from "@/server/application/use-cases/upload-car-image/uploadCarImage";
import { AppError } from "@/server/domain/errors";

/**
 * POST /api/customize/upload
 *
 * Accepts a multipart/form-data request with an `image` File, uploads it to
 * Vercel Blob, and returns its public URL. Used to seed the customization flow
 * with the user's base car photo.
 */
export async function POST(request: Request) {
  const { error } = await requireAuthAPI();
  if (error) return error;

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return apiError("Expected multipart/form-data request", 400);
  }

  const image = formData.get("image");
  if (!(image instanceof File)) {
    return apiError("An image file is required", 400);
  }

  try {
    const result = await uploadCarImage(image);
    return apiSuccess(result, 201);
  } catch (err) {
    if (err instanceof AppError) {
      return apiError(err.message, err.statusCode, err.errorCode);
    }
    return apiServerError(err);
  }
}
