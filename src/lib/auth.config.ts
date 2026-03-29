import type { NextAuthConfig } from "next-auth";

declare module "next-auth" {
  interface User {
    role: string;
    isApproved: boolean;
  }
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: string;
      isApproved: boolean;
      image?: string | null;
    };
  }
}

export const authConfig = {
  session: { strategy: "jwt" as const },
  pages: {
    signIn: "/login",
  },
  providers: [],
  callbacks: {
    async jwt({ token, user }: any) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.isApproved = user.isApproved;
      }
      return token;
    },
    async session({ session, token }: any) {
      session.user.id = token.id;
      session.user.role = token.role;
      session.user.isApproved = token.isApproved;
      return session;
    },
  },
} satisfies NextAuthConfig;
