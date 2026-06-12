import Image from "next/image";
import Link from "next/link";
import { SettingsForm } from "@/features/auth/components/settings-form";
import { requireAuth } from "@/lib/auth/auth-utils";

export default async function SettingsPage() {
  const session = await requireAuth();
  const user = session.user;

  return (
    <div className="min-h-screen bg-[#07060d] text-zinc-100">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="-top-40 -left-40 absolute h-[30rem] w-[30rem] rounded-full bg-violet-700/15 blur-[120px]" />
        <div className="-right-40 absolute top-1/3 h-[28rem] w-[28rem] rounded-full bg-blue-700/10 blur-[120px]" />
      </div>

      <header className="relative border-white/5 border-b bg-[#07060d]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-3">
          <Link href="/" className="flex items-center gap-2.5">
            <Image
              src="/assets/logo-01.png"
              alt="Garage AI"
              width={48}
              height={48}
              className="h-12 w-12"
            />
            <span className="font-extrabold text-lg tracking-tight">
              GARAGE
              <span className="bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent">
                AI
              </span>
            </span>
          </Link>
          <Link
            href="/"
            className="text-sm text-zinc-400 transition hover:text-white"
          >
            &larr; Back to home
          </Link>
        </div>
      </header>

      <main className="relative mx-auto max-w-3xl px-6 py-10">
        <h1 className="font-extrabold text-3xl tracking-tight">
          Account settings
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Manage your profile and account preferences.
        </p>

        <div className="mt-8">
          <SettingsForm
            initialName={user?.name ?? ""}
            email={user?.email ?? ""}
            image={user?.image ?? null}
          />
        </div>
      </main>
    </div>
  );
}
