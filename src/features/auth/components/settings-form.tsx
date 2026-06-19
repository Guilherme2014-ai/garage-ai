"use client";

import { signOut, useSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";
import { fetchCredits } from "@/features/customize/api/creditsApi";
import { UpgradeDialog } from "@/features/customize/components/UpgradeDialog";

type SettingsFormProps = {
  initialName: string;
  email: string;
  image: string | null;
};

type Status =
  | { type: "idle" }
  | { type: "success"; message: string }
  | { type: "error"; message: string };

function getInitials(name: string, email: string) {
  const source = name.trim() || email.trim();
  if (!source) return "U";
  const parts = source.split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function SettingsForm({ initialName, email, image }: SettingsFormProps) {
  const { update } = useSession();
  const [name, setName] = useState(initialName);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<Status>({ type: "idle" });
  const [credits, setCredits] = useState<number | null>(null);
  const [buyOpen, setBuyOpen] = useState(false);

  const refreshCredits = useCallback(async () => {
    try {
      const next = await fetchCredits();
      setCredits(next.credits);
    } catch {
      // leave the previous value; the card just won't update
    }
  }, []);

  // Load on mount and whenever the user returns (e.g. from a checkout tab).
  useEffect(() => {
    void refreshCredits();
    window.addEventListener("focus", refreshCredits);
    return () => window.removeEventListener("focus", refreshCredits);
  }, [refreshCredits]);

  const trimmed = name.trim();
  const isDirty = trimmed !== initialName.trim();
  const canSave = isDirty && trimmed.length > 0 && !loading;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSave) return;

    setLoading(true);
    setStatus({ type: "idle" });

    try {
      const res = await fetch("/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      const data = await res.json();

      if (!data.success) {
        setStatus({
          type: "error",
          message: data.message ?? "Something went wrong",
        });
        return;
      }

      await update({ name: trimmed });
      setStatus({ type: "success", message: "Changes saved." });
    } catch {
      setStatus({ type: "error", message: "Something went wrong. Try again." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 sm:p-8"
      >
        <h2 className="font-semibold text-lg">Profile</h2>
        <p className="mt-1 text-sm text-zinc-500">
          This information is shown across your Garage AI account.
        </p>

        <div className="mt-6 flex items-center gap-4">
          {image ? (
            // biome-ignore lint/performance/noImgElement: avatar can be an arbitrary remote URL
            <img
              src={image}
              alt={trimmed || email}
              className="h-16 w-16 rounded-full object-cover"
            />
          ) : (
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-blue-500 font-semibold text-white text-xl">
              {getInitials(name, email)}
            </span>
          )}
          <div>
            <p className="font-medium text-sm">{trimmed || "Your name"}</p>
            <p className="text-xs text-zinc-500">{email}</p>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-1.5">
          <label htmlFor="name" className="font-medium text-sm text-zinc-300">
            Name
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className="h-11 rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-500 focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/40"
          />
        </div>

        <div className="mt-4 flex flex-col gap-1.5">
          <label htmlFor="email" className="font-medium text-sm text-zinc-300">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            disabled
            className="h-11 cursor-not-allowed rounded-lg border border-white/10 bg-white/[0.02] px-3 text-sm text-zinc-500"
          />
          <p className="text-xs text-zinc-600">Email cannot be changed.</p>
        </div>

        <div className="mt-6 flex items-center gap-4">
          <button
            type="submit"
            disabled={!canSave}
            className="flex h-10 items-center justify-center rounded-lg bg-gradient-to-r from-violet-600 to-blue-500 px-5 font-medium text-sm text-white shadow-lg shadow-violet-900/30 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading ? "Saving..." : "Save changes"}
          </button>

          {status.type === "success" && (
            <span className="text-emerald-400 text-sm">{status.message}</span>
          )}
          {status.type === "error" && (
            <span className="text-red-400 text-sm">{status.message}</span>
          )}
        </div>
      </form>

      <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.02] p-6 sm:p-8">
        <div>
          <h2 className="font-semibold text-lg">Credits</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Credits power category modifications.{" "}
            <span className="text-zinc-300">
              Balance: {credits === null ? "…" : credits}
            </span>
          </p>
        </div>
        <button
          type="button"
          onClick={() => setBuyOpen(true)}
          className="h-10 rounded-lg bg-gradient-to-r from-violet-600 to-blue-500 px-5 font-medium text-sm text-white shadow-lg shadow-violet-900/30 transition hover:opacity-90"
        >
          Buy credits
        </button>
      </div>

      <UpgradeDialog open={buyOpen} onClose={() => setBuyOpen(false)} />

      <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.02] p-6 sm:p-8">
        <div>
          <h2 className="font-semibold text-lg">Sign out</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Sign out of your account on this device.
          </p>
        </div>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/" })}
          className="h-10 rounded-lg border border-red-500/30 bg-red-500/10 px-5 font-medium text-red-400 text-sm transition hover:bg-red-500/20"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
