"use client";

import Image from "next/image";
import Link from "next/link";
import { useId, useState } from "react";
import { fetchCustomizationOptions, uploadCarImage } from "../api/customizeApi";
import { buildInitialDataFromOptions } from "../core/customization-options/generation/buildInitialData";
import type { CustomizationData } from "../core/customization-options/types/CustomizationData";
import type { PlanMode } from "../core/plan/planMode";

type IntakeStatus = "idle" | "uploading" | "generating";

type CarIntakeFormProps = {
  onReady: (
    data: CustomizationData,
    carName: string,
    planMode: PlanMode,
    credits: number,
    baseImageUrl: string,
  ) => void;
};

const STATUS_LABEL: Record<Exclude<IntakeStatus, "idle">, string> = {
  uploading: "Uploading your car photo…",
  generating: "Building your garage with AI…",
};

export function CarIntakeForm({ onReady }: CarIntakeFormProps) {
  const fileInputId = useId();
  const [carName, setCarName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<IntakeStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const busy = status !== "idle";

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0] ?? null;
    setFile(selected);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return selected ? URL.createObjectURL(selected) : null;
    });
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    const name = carName.trim();
    if (!name) {
      setError("Enter your car's name and model.");
      return;
    }
    if (!file) {
      setError("Upload a photo of your car.");
      return;
    }

    try {
      setStatus("uploading");
      const baseImageUrl = await uploadCarImage(file);

      setStatus("generating");
      const options = await fetchCustomizationOptions(name);
      const data = buildInitialDataFromOptions(options, baseImageUrl);

      onReady(data, name, options.planMode, options.credits, baseImageUrl);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.",
      );
      setStatus("idle");
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#07060d] text-zinc-100">
      <header className="flex items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2.5">
          <Image
            src="/assets/logo-01.png"
            alt="Garage AI"
            width={40}
            height={40}
            className="h-10 w-10"
          />
          <span className="font-extrabold text-lg tracking-tight">
            GARAGE
            <span className="bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent">
              AI
            </span>
          </span>
        </Link>
      </header>

      <main className="flex flex-1 items-center justify-center px-6 py-10">
        <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-white/[0.02] p-8 shadow-2xl shadow-black/40">
          <h1 className="font-bold text-2xl tracking-tight">
            Start your build
          </h1>
          <p className="mt-2 text-sm text-zinc-400">
            Upload a clear photo of your car and tell us what it is. We'll
            tailor customization options to your exact model.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <div>
              <label
                htmlFor="car-name"
                className="mb-1.5 block font-medium text-sm text-zinc-300"
              >
                Car name &amp; model
              </label>
              <input
                id="car-name"
                type="text"
                value={carName}
                onChange={(e) => setCarName(e.target.value)}
                disabled={busy}
                placeholder="e.g. Nissan Skyline GT-R R34"
                className="w-full rounded-xl border border-white/10 bg-[#0d0b16] px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:border-violet-500/60 focus:outline-none disabled:opacity-60"
              />
            </div>

            <div>
              <span className="mb-1.5 block font-medium text-sm text-zinc-300">
                Car photo
              </span>
              <label
                htmlFor={fileInputId}
                className="group flex cursor-pointer flex-col items-center justify-center gap-3 overflow-hidden rounded-xl border border-violet-500/30 border-dashed bg-violet-500/5 p-6 text-center transition hover:bg-violet-500/10"
              >
                {previewUrl ? (
                  // biome-ignore lint/performance/noImgElement: local object URL preview.
                  <img
                    src={previewUrl}
                    alt="Selected car"
                    className="max-h-48 w-full rounded-lg object-contain"
                  />
                ) : (
                  <>
                    <UploadIcon className="h-8 w-8 text-violet-400" />
                    <span className="font-semibold text-sm">
                      Click to upload your car
                    </span>
                    <span className="text-xs text-zinc-500">
                      JPG, PNG or WebP up to 25MB
                    </span>
                  </>
                )}
              </label>
              <input
                id={fileInputId}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileChange}
                disabled={busy}
                className="hidden"
              />
              {previewUrl && !busy && (
                <p className="mt-2 text-center text-xs text-zinc-500">
                  Click the image to choose a different photo
                </p>
              )}
            </div>

            {error && (
              <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={busy}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-blue-500 py-3 font-medium text-sm text-white shadow-lg shadow-violet-900/30 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {busy ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  {STATUS_LABEL[status]}
                </>
              ) : (
                "Start Customizing"
              )}
            </button>

            {status === "generating" && (
              <p className="text-center text-xs text-zinc-500">
                This can take a moment while the AI studies your car.
              </p>
            )}
          </form>
        </div>
      </main>
    </div>
  );
}

function UploadIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <path d="m17 8-5-5-5 5" />
      <path d="M12 3v12" />
    </svg>
  );
}
