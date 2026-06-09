import { apiError, apiServerError, apiSuccess } from "@/lib/api/api-response";
import { signUp } from "@/server/application/use-cases/signup/signup";
import { AppError } from "@/server/domain/errors";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, password } = body;

    if (!name || !email || !password) {
      return apiError("Name, email, and password are required", 400);
    }

    const user = await signUp({ name, email, password });
    return apiSuccess(user, 201);
  } catch (error) {
    if (error instanceof AppError) {
      return apiError(error.message, error.statusCode, error.errorCode);
    }
    return apiServerError(error);
  }
}
