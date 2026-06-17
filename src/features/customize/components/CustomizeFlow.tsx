"use client";

import { useState } from "react";
import type { CustomizationData } from "../core/customization-options/types/CustomizationData";
import { CarIntakeForm } from "./CarIntakeForm";
import { CustomizeWorkspace } from "./CustomizeWorkspace";

type ReadyState = {
  data: CustomizationData;
  carName: string;
};

/**
 * Top-level customization flow: collects the car photo + name, builds the
 * initial data from the LLM options response, then hands off to the workspace.
 */
export function CustomizeFlow() {
  const [ready, setReady] = useState<ReadyState | null>(null);

  if (!ready) {
    return (
      <CarIntakeForm onReady={(data, carName) => setReady({ data, carName })} />
    );
  }

  return (
    <CustomizeWorkspace initialData={ready.data} carName={ready.carName} />
  );
}
