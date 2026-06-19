/**
 * Client-side wrappers around the builds routes. A "build" is a persisted
 * customization session (current state + history + caches), serialized as a
 * {@link BuildSnapshot}. Mirrors the shape of the other feature API modules.
 */

import type { BuildSnapshot } from "../core/customization-options/types/BuildSnapshot";

/** A saved build with its full serialized session. */
export interface BuildDTO {
  id: string;
  carName: string;
  baseImageUrl: string;
  state: BuildSnapshot;
  createdAt: string;
  updatedAt: string;
}

interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  message?: string;
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

/** Creates a new saved build from the initial session snapshot. */
export async function createBuild(input: {
  carName: string;
  baseImageUrl: string;
  state: BuildSnapshot;
}): Promise<BuildDTO> {
  const response = await fetch("/api/builds", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return unwrap<BuildDTO>(response);
}

/** Loads a saved build (with its full state) to resume the session. */
export async function fetchBuild(id: string): Promise<BuildDTO> {
  const response = await fetch(`/api/builds/${id}`);
  return unwrap<BuildDTO>(response);
}

/** Persists the latest session state for an existing build. */
export async function updateBuild(
  id: string,
  input: { state: BuildSnapshot; carName?: string },
): Promise<BuildDTO> {
  const response = await fetch(`/api/builds/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return unwrap<BuildDTO>(response);
}
