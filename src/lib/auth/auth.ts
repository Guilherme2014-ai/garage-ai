import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import type { SignInInput } from "@/server/application/services/auth.service";
import { authService } from "@/server/application/services/auth.service";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          const { email, password } = credentials as SignInInput;
          if (!email || !password) return null;

          const user = await authService.signIn({ email, password });
          return user;
        } catch {
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      // Credentials sign-in is already resolved in `authorize`.
      if (account?.provider !== "google") return true;

      if (!user.email) return false;

      // Upsert the application user and carry our own id forward so the JWT
      // (and everything downstream) keys off the database user, not Google's.
      const appUser = await authService.findOrCreateOAuthUser({
        provider: "google",
        providerId: account.providerAccountId,
        email: user.email,
        name: user.name ?? user.email,
        image: user.image ?? null,
      });
      user.id = appUser.id;
      return true;
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id ?? "";
        token.email = user.email;
        token.name = user.name;
        token.picture = user.image;
      }

      if (trigger === "update" && session?.name) {
        token.name = session.name as string;
      }

      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.image = token.picture as string | undefined;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  secret: process.env.AUTH_SECRET,
});
