"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createBuild, updateBuild } from "../api/buildsApi";
import type { CustomizationDataCoordinator } from "../core/customization-options/CustomizationData.coordinator";

/** Debounce window before a change is autosaved to the backend. */
const AUTOSAVE_DELAY_MS = 1200;

type UseBuildPersistenceArgs = {
  coordinator: CustomizationDataCoordinator;
  /** Existing build id when resuming a saved session; omit for a new one. */
  initialBuildId?: string;
  carName: string;
  /** The stock (uploaded) car image, stored as the build's base. */
  baseImageUrl: string;
};

/**
 * Persists a customization session as a "build". It:
 *
 * - creates the build on first mount (when there's no id yet) and reflects the
 *   id into the `?build=` URL param, so a reload or a return from checkout can
 *   resume the same session;
 * - autosaves the full serialized snapshot (state + history + caches) a short
 *   debounce after any change, and flushes when the tab is hidden;
 * - exposes {@link saveNow} for the explicit "Save Build" action.
 *
 * The coordinator stays persistence-agnostic — this hook only reads its
 * {@link CustomizationDataCoordinator.serialize} output and subscribes to its
 * change notifications.
 */
export function useBuildPersistence({
  coordinator,
  initialBuildId,
  carName,
  baseImageUrl,
}: UseBuildPersistenceArgs) {
  const [buildId, setBuildId] = useState<string | null>(initialBuildId ?? null);
  const [dirty, setDirty] = useState(false);
  // A brand-new session is "saving" until its first create lands.
  const [saving, setSaving] = useState(!initialBuildId);

  const buildIdRef = useRef<string | null>(initialBuildId ?? null);
  const dirtyRef = useRef(false);
  const savingRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const adoptBuildId = useCallback((id: string) => {
    buildIdRef.current = id;
    setBuildId(id);
    // Reflect the id in the URL without a navigation (which would remount the
    // workspace and lose in-memory state).
    const url = new URL(window.location.href);
    if (url.searchParams.get("build") !== id) {
      url.searchParams.set("build", id);
      window.history.replaceState(window.history.state, "", url.toString());
    }
  }, []);

  const scheduleSave = useCallback(() => {
    dirtyRef.current = true;
    setDirty(true);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(() => {
      void persistRef.current();
    }, AUTOSAVE_DELAY_MS);
  }, []);

  /**
   * Single write path: creates the build when there's no id yet, otherwise
   * updates it. Guards against concurrent/duplicate writes (incl. React
   * StrictMode double-mount) via `savingRef`, and re-schedules if more edits
   * arrive mid-save.
   */
  const persist = useCallback(async () => {
    if (savingRef.current) {
      return;
    }
    // Nothing to do: an existing build with no pending changes.
    if (buildIdRef.current && !dirtyRef.current) {
      return;
    }

    savingRef.current = true;
    setSaving(true);
    dirtyRef.current = false;
    setDirty(false);

    try {
      if (buildIdRef.current) {
        await updateBuild(buildIdRef.current, {
          state: coordinator.serialize(),
          carName,
        });
      } else {
        const build = await createBuild({
          carName,
          baseImageUrl,
          state: coordinator.serialize(),
        });
        adoptBuildId(build.id);
      }
    } catch {
      // Keep the session marked dirty so the next change (or saveNow) retries.
      dirtyRef.current = true;
      setDirty(true);
    } finally {
      savingRef.current = false;
      setSaving(false);
      if (dirtyRef.current) {
        scheduleSave();
      }
    }
  }, [coordinator, carName, baseImageUrl, adoptBuildId, scheduleSave]);

  // Stable indirection so the debounce timer always calls the latest persist.
  const persistRef = useRef(persist);
  persistRef.current = persist;

  // Create the build once for a new session.
  useEffect(() => {
    if (buildIdRef.current) {
      return;
    }
    void persist();
  }, [persist]);

  // Autosave on every coordinator change (debounced).
  useEffect(() => {
    const unsubscribe = coordinator.subscribe(() => scheduleSave());
    return () => {
      unsubscribe();
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [coordinator, scheduleSave]);

  // Best-effort flush when the tab is hidden/closed so the last debounced
  // window isn't lost.
  useEffect(() => {
    function flushOnHide() {
      if (dirtyRef.current) {
        void persistRef.current();
      }
    }
    function onVisibilityChange() {
      if (document.visibilityState === "hidden") {
        flushOnHide();
      }
    }
    window.addEventListener("pagehide", flushOnHide);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      window.removeEventListener("pagehide", flushOnHide);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  /** Flushes any pending changes immediately (the explicit Save action). */
  const saveNow = useCallback(async () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    await persist();
  }, [persist]);

  return {
    buildId,
    isSaving: saving,
    /** A build exists and there are no unsaved changes. */
    isSaved: !!buildId && !dirty && !saving,
    saveNow,
  };
}
