import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";

export async function requireAuth() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  return session;
}

export async function getServerSession() {
  return await auth();
}

export async function requireAuthAPI() {
  const session = await auth();

  if (!session?.user) {
    return {
      session: null,
      error: NextResponse.json(
        { success: false, message: "Unauthorized. Please sign in." },
        { status: 401 },
      ),
    };
  }

  return { session, error: null };
}
