import { SignInForm } from "@/features/auth/components/signin-form";

export default function SignInPage() {
  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            Sign in to Garage AI
          </h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Enter your credentials to continue
          </p>
        </div>

        <SignInForm />
      </div>
    </div>
  );
}
