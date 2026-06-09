"use server";

import { signIn, signOut } from "@/lib/auth/auth";

export async function signInAction(
  provider: string,
  options?: { email?: string; password?: string; redirectTo?: string },
) {
  await signIn(provider, options);
}

export async function signOutAction() {
  await signOut();
}
