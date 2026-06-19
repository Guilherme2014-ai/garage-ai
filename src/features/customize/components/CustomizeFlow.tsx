"use client";

import { useEffect, useState } from "react";
import { fetchBuild } from "../api/buildsApi";
import { fetchCredits } from "../api/creditsApi";
import type { BuildSnapshot } from "../core/customization-options/types/BuildSnapshot";
import type { CustomizationData } from "../core/customization-options/types/CustomizationData";
import type { PlanMode } from "../core/plan/planMode";
import { CarIntakeForm } from "./CarIntakeForm";
import { CustomizeWorkspace } from "./CustomizeWorkspace";
import { SparkleIcon } from "./icons";

type ReadyState = {
  data: CustomizationData;
  carName: string;
  planMode: PlanMode;
  credits: number;
  baseImageUrl: string;
  /** Set when resuming a saved build. */
  buildId?: string;
  snapshot?: BuildSnapshot;
};

type CustomizeFlowProps = {
  /** Build id from the `?build=` URL param — resumes that saved session. */
  initialBuildId?: string;
};

/**
 * Top-level customization flow. With a `?build=` id it resumes the saved
 * session (loading its snapshot + the current credit balance); otherwise it
 * collects the car photo + name, builds the initial data from the LLM options
 * response, then hands off to the workspace.
 */
export function CustomizeFlow({ initialBuildId }: CustomizeFlowProps) {
  const [ready, setReady] = useState<ReadyState | null>(null);
  const [loading, setLoading] = useState(!!initialBuildId);

  useEffect(() => {
    if (!initialBuildId) {
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const [build, account] = await Promise.all([
          fetchBuild(initialBuildId),
          fetchCredits(),
        ]);
        if (cancelled) {
          return;
        }
        setReady({
          data: build.state.data,
          snapshot: build.state,
          buildId: build.id,
          carName: build.carName,
          baseImageUrl: build.baseImageUrl,
          planMode: account.planMode,
          credits: account.credits,
        });
      } catch {
        // Build missing / not owned — fall back to a fresh intake.
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [initialBuildId]);

  if (loading) {
    return <LoadingBuild />;
  }

  if (!ready) {
    return (
      <CarIntakeForm
        onReady={(data, carName, planMode, credits, baseImageUrl) =>
          setReady({ data, carName, planMode, credits, baseImageUrl })
        }
      />
    );
  }

  return (
    <CustomizeWorkspace
      initialData={ready.data}
      initialSnapshot={ready.snapshot}
      initialBuildId={ready.buildId}
      carName={ready.carName}
      baseImageUrl={ready.baseImageUrl}
      planMode={ready.planMode}
      initialCredits={ready.credits}
    />
  );
}

function LoadingBuild() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[#07060d] text-zinc-100">
      <span className="relative flex h-10 w-10">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet-500/40" />
        <span className="relative inline-flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-blue-500 text-white">
          <SparkleIcon className="h-5 w-5" />
        </span>
      </span>
      <p className="font-medium text-sm text-zinc-400">Loading your build…</p>
    </div>
  );
}
