import { NextResponse } from "next/server";

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  errorCode?: string;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json(
    { success: true, data } satisfies ApiSuccessResponse<T>,
    { status },
  );
}

export function apiError(message: string, status = 400, errorCode?: string) {
  return NextResponse.json(
    { success: false, message, errorCode } satisfies ApiErrorResponse,
    { status },
  );
}

export function apiServerError(error: unknown) {
  const message =
    error instanceof Error ? error.message : "An unexpected error occurred";
  console.error("Server error:", error);
  return apiError(message, 500);
}
