import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4">
      <main className="flex w-full max-w-md flex-col items-center gap-8 text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
          Garage AI
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Welcome to Garage AI. Get started by signing in.
        </p>
        <Link
          href="/auth/signin"
          className="flex h-10 items-center justify-center rounded-md bg-zinc-900 px-6 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Sign in
        </Link>
      </main>
    </div>
  );
}
