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

// Shape do JWT que carregamos. Nao usamos `declare module "next-auth/jwt"`
// porque a resolucao do submodule e fragil em algumas combinacoes de tsconfig
// (passa em dev, falha no `next build`).
type AppJWT = {
  id: string;
  tenantId: string;
  role: Role;
  email?: string;
  name?: string;
  [key: string]: unknown;
};

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
      const t = token as AppJWT;
      if (user) {
        t.id = user.id!;
        t.tenantId = user.tenantId;
        t.role = user.role;
        // Auth.js v5 NAO copia email/name automaticamente quando ha callback
        // custom. Explicitamos pra session.user.email funcionar.
        if (user.email) t.email = user.email;
        if (user.name) t.name = user.name;
      }
      return t;
    },
    async session({ session, token }) {
      const t = token as AppJWT;
      if (session.user) {
        session.user.id = t.id;
        session.user.tenantId = t.tenantId;
        session.user.role = t.role;
        if (typeof t.email === "string") session.user.email = t.email;
        if (typeof t.name === "string") session.user.name = t.name;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
