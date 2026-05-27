import NextAuth, { type Provider } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authConfig } from "@/lib/auth.config";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(200),
});

// Provider Google so adicionado quando env vars configuradas.
// Sem isso, /login mostra apenas form email/senha.
const providers: Provider[] = [
  Credentials({
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Senha", type: "password" },
    },
    async authorize(raw) {
      const parsed = credentialsSchema.safeParse(raw);
      if (!parsed.success) return null;

      const user = await prisma.user.findUnique({
        where: { email: parsed.data.email.toLowerCase() },
        select: {
          id: true,
          email: true,
          name: true,
          passwordHash: true,
          role: true,
          tenantId: true,
          active: true,
        },
      });

      if (!user || !user.active) return null;

      const ok = await bcrypt.compare(parsed.data.password, user.passwordHash);
      if (!ok) return null;

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        tenantId: user.tenantId,
        role: user.role,
      };
    },
  }),
];

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
  );
}

export const googleEnabled = Boolean(
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET,
);

/**
 * Auth completo (Node runtime) com Credentials + opcional Google.
 * Usado nas API routes e server components — NUNCA no middleware (Edge).
 * O middleware usa `authConfig` direto via NextAuth(authConfig).
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers,
  callbacks: {
    ...authConfig.callbacks,
    /**
     * Login via Google: so permite se email ja existe como user ATIVO
     * no DB. Forca admin a convidar antes (nao cria conta automaticamente
     * via OAuth — protege contra signup de qualquer um com Google account).
     */
    async signIn({ user, account }) {
      if (account?.provider === "credentials") return true;
      if (account?.provider === "google" && user.email) {
        const exists = await prisma.user.findFirst({
          where: { email: user.email.toLowerCase(), active: true },
          select: { id: true },
        });
        return !!exists;
      }
      return true;
    },
    /**
     * Override do jwt callback do authConfig pra ALEM de credentials
     * tambem popular tenantId/role/email/name quando login eh via Google.
     */
    async jwt({ token, user, account }) {
      // Edge runtime tambem chama esse callback, mas sem user/account
      // (apenas reverificacao do token existente). Nesses casos, pula
      // qualquer query Prisma — token ja tem os campos.
      if (!user || !account) return token;

      if (account.provider === "credentials") {
        // Mesma logica do auth.config.ts
        const u = user as unknown as { id: string; tenantId: string; role: string; email?: string; name?: string };
        token.id = u.id;
        token.tenantId = u.tenantId;
        token.role = u.role;
        if (u.email) token.email = u.email;
        if (u.name) token.name = u.name;
        return token;
      }

      if (account.provider === "google" && user.email) {
        // Lookup do User no DB pra pegar tenantId/role
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email.toLowerCase() },
          select: { id: true, tenantId: true, role: true, name: true, email: true },
        });
        if (dbUser) {
          token.id = dbUser.id;
          token.tenantId = dbUser.tenantId;
          token.role = dbUser.role;
          token.email = dbUser.email;
          token.name = dbUser.name;
        }
      }

      return token;
    },
  },
});
