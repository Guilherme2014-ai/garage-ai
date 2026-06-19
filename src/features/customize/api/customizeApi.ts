/**
 * Client-side wrappers around the customization backend routes. Each returns
 * the unwrapped `data` payload and throws a readable error on failure.
 */

import type { PlanMode } from "../core/plan/planMode";

/** A single LLM-recommended option as returned by `/api/customize/options`. */
export interface ApiCustomizationOption {
  rank: number;
  name: string;
  brand: string;
  description: string;
  visualDescription: string;
  price: number;
  colorHex?: string;
  tags: string[];
}

export interface ApiCustomizationOptionsResult {
  car: string;
  vehicleProfile: { style: string; era: string; summary: string };
  categories: Record<string, ApiCustomizationOption[]>;
  planMode: PlanMode;
}

interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  message?: string;
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return unwrap<T>(response);
}

async function unwrap<T>(response: Response): Promise<T> {
  let payload: ApiEnvelope<T> | null = null;
  try {
    payload = (await response.json()) as ApiEnvelope<T>;
  } catch {
    // fall through to status-based error
  }

  if (!response.ok || !payload?.success || payload.data === undefined) {
    const message = payload?.message ?? `Request failed (${response.status})`;
    throw new Error(message);
  }

  return payload.data;
}

/** Uploads the base car photo and returns its public URL. */
export async function uploadCarImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("image", file);

  const response = await fetch("/api/customize/upload", {
    method: "POST",
    body: formData,
  });
  const data = await unwrap<{ url: string }>(response);
  return data.url;
}

/** Requests vehicle-aware customization options for the given categories. */
export async function fetchCustomizationOptions(
  car: string,
  categories: string[],
): Promise<ApiCustomizationOptionsResult> {
  return postJson<ApiCustomizationOptionsResult>("/api/customize/options", {
    car,
    categories,
  });
}

/**
 * Applies one option to the current car image. The backend builds the prompt
 * from `name` + `visualDescription`; we only pass the current image URL and the
 * option metadata.
 */
export async function editCarImage(params: {
  imageUrl: string;
  name: string;
  visualDescription: string;
}): Promise<string> {
  const data = await postJson<{ imageUrl: string; sourceUrl: string }>(
    "/api/customize/edit",
    params,
  );
  return data.imageUrl;
}
