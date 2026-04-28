import type { NextAuthConfig } from "next-auth";

// Tipo Role replicado como string literal para evitar import de @prisma/client
// (que arrastaria runtime do Prisma pro bundle Edge do middleware).
type Role = "ADMIN" | "GESTOR" | "FINANCEIRO";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      tenantId: string;
      role: Role;
    };
  }
  interface User {
    id?: string;
    tenantId: string;
    role: Role;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    tenantId: string;
    role: Role;
  }
}

/**
 * Config Edge-safe do Auth.js. Sem providers, sem Prisma, sem bcrypt.
 * Usado pelo middleware (que roda no Edge Runtime).
 * O auth.ts importa este e adiciona o Credentials provider (que usa Prisma).
 */
export const authConfig = {
  session: { strategy: "jwt", maxAge: 60 * 60 * 8 }, // 8h
  pages: { signIn: "/login" },
  trustHost: true,
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id!;
        token.tenantId = user.tenantId;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id;
        session.user.tenantId = token.tenantId;
        session.user.role = token.role;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
