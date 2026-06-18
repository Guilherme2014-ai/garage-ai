"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { XIcon } from "./icons";

type CompareDialogProps = {
  open: boolean;
  beforeUrl: string;
  afterUrl: string;
  modCount: number;
  onClose: () => void;
};

/**
 * Full-screen before/after comparison with a draggable reveal handle. "Before"
 * is the stock car photo; "after" is the current AI-generated build. The handle
 * is driven by pointer events so it works with both mouse and touch.
 */
export function CompareDialog({
  open,
  beforeUrl,
  afterUrl,
  modCount,
  onClose,
}: CompareDialogProps) {
  const [position, setPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);

  useEffect(() => {
    if (!open) {
      return;
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Reset to the centre each time the dialog is reopened.
  useEffect(() => {
    if (open) {
      setPosition(50);
    }
  }, [open]);

  const updateFromClientX = useCallback((clientX: number) => {
    const el = containerRef.current;
    if (!el) {
      return;
    }
    const rect = el.getBoundingClientRect();
    const pct = ((clientX - rect.left) / rect.width) * 100;
    setPosition(Math.min(100, Math.max(0, pct)));
  }, []);

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Compare stock and customized build"
    >
      {/* Click-away backdrop */}
      <button
        type="button"
        aria-label="Close compare"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
      />

      <div className="relative w-full max-w-3xl">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-lg">Before / After</h2>
            <p className="text-xs text-zinc-400">
              Drag the handle to compare stock with your {modCount} mod
              {modCount === 1 ? "" : "s"}.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close compare"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-zinc-300 transition hover:bg-white/10"
          >
            <XIcon className="h-4 w-4" />
          </button>
        </div>

        <div
          ref={containerRef}
          className="relative aspect-[16/9] w-full touch-none select-none overflow-hidden rounded-2xl border border-white/10 bg-[#08070f]"
          onPointerDown={(event) => {
            draggingRef.current = true;
            event.currentTarget.setPointerCapture(event.pointerId);
            updateFromClientX(event.clientX);
          }}
          onPointerMove={(event) => {
            if (draggingRef.current) {
              updateFromClientX(event.clientX);
            }
          }}
          onPointerUp={() => {
            draggingRef.current = false;
          }}
          onPointerCancel={() => {
            draggingRef.current = false;
          }}
        >
          {/* After (full) */}
          {/* biome-ignore lint/performance/noImgElement: AI output is a dynamic remote URL; next/image would need per-host remotePatterns config. */}
          <img
            src={afterUrl}
            alt="Customized build"
            draggable={false}
            className="absolute inset-0 h-full w-full object-contain"
          />

          {/* Before (clipped to the left of the handle) */}
          {/* biome-ignore lint/performance/noImgElement: AI output is a dynamic remote URL; next/image would need per-host remotePatterns config. */}
          <img
            src={beforeUrl}
            alt="Stock car"
            draggable={false}
            className="absolute inset-0 h-full w-full object-contain"
            style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
          />

          <span className="absolute top-3 left-3 rounded-md border border-white/10 bg-black/60 px-2 py-1 font-medium text-[10px] text-zinc-200 uppercase tracking-wide backdrop-blur">
            Stock
          </span>
          <span className="absolute top-3 right-3 rounded-md border border-violet-500/30 bg-violet-500/20 px-2 py-1 font-medium text-[10px] text-violet-200 uppercase tracking-wide backdrop-blur">
            Build
          </span>

          {/* Divider + handle */}
          <div
            className="pointer-events-none absolute inset-y-0"
            style={{ left: `${position}%` }}
          >
            <div className="-translate-x-1/2 absolute inset-y-0 w-0.5 bg-white/80" />
            <div className="-translate-x-1/2 -translate-y-1/2 absolute top-1/2 flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-black/70 text-white shadow-lg">
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="m15 18-6-6 6-6" />
                <path d="m9 6 6 6-6 6" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
