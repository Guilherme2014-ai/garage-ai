import type { PlanMode } from "@/server/domain/plan/plan-mode";

export interface GenerateCustomizationOptionsInput {
  /** Vehicle name/model, e.g. "Nissan Skyline GT-R R34". */
  car: string;
  /**
   * Client-supplied categories. Only consulted in mock/testing mode — real
   * generation owns its category set on the backend (see `categories.ts`), so
   * this is optional and ignored for live LLM calls.
   */
  categories?: string[];
  /** Plan mode the request is served under; gates category/option counts. */
  planMode: PlanMode;
}

/** A single vehicle-aware aftermarket recommendation. */
export interface CustomizationOption {
  /** 1 = most relevant. Mirrors the array order. */
  rank: number;
  /** Product/part name, e.g. "TE37 Saga". */
  name: string;
  /** Real-world brand/manufacturer, e.g. "Volk Racing (Rays)". */
  brand: string;
  /** Why this part fits the vehicle's style, era, and community. */
  description: string;
  /**
   * Concise, image-model-friendly description of how the part looks once
   * installed. Consumed by the car image modification route to build the edit
   * prompt, e.g. "bronze 6-spoke forged wheels with a deep concave face".
   */
  visualDescription: string;
  /** Rough aftermarket price estimate in USD. 0 when it ships included. */
  price: number;
  /** Signature hex color when meaningful (mainly paint), e.g. "#5b21b6". */
  colorHex?: string;
  /** Free-form descriptors, e.g. ["JDM", "forged", "track"]. */
  tags: string[];
}

/** Inferred profile used to tailor recommendations. */
export interface VehicleProfile {
  /** e.g. "JDM", "Euro", "Muscle", "Supercar", "Track", "Drift", "Stance". */
  style: string;
  era: string;
  summary: string;
}

export interface CustomizationOptionsResult {
  car: string;
  vehicleProfile: VehicleProfile;
  /** Category slug -> ranked options (most to least relevant). */
  categories: Record<string, CustomizationOption[]>;
  /** Plan mode the options were generated under. */
  planMode: PlanMode;
}
