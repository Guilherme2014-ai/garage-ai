import Link from "next/link";

const ERROR_MESSAGES: Record<string, string> = {
  Configuration:
    "There is a problem with the server configuration. Please try again later.",
  AccessDenied: "You do not have permission to sign in.",
  Verification:
    "The sign-in link is no longer valid. Please request a new one.",
  CredentialsSignin: "Invalid email or password. Please try again.",
  Default: "Something went wrong while signing in. Please try again.",
};

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const message = ERROR_MESSAGES[error ?? "Default"] ?? ERROR_MESSAGES.Default;

  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm space-y-6 text-center">
        <div>
          <h1 className="font-semibold text-2xl text-zinc-900 tracking-tight dark:text-zinc-100">
            Authentication error
          </h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            {message}
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <Link
            href="/auth/signin"
            className="flex h-10 items-center justify-center rounded-md bg-zinc-900 font-medium text-sm text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Back to sign in
          </Link>
          <Link
            href="/"
            className="text-sm text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            Return home
          </Link>
        </div>
      </div>
    </div>
  );
}
