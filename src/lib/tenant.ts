import { auth } from "@/lib/auth";
import { Role } from "@prisma/client";

export class UnauthorizedError extends Error {
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends Error {
  constructor(message = "Forbidden") {
    super(message);
    this.name = "ForbiddenError";
  }
}

export interface AuthContext {
  userId: string;
  tenantId: string;
  email: string;
  role: Role;
}

/**
 * Resolve o contexto de autenticação a partir da sessão.
 * Lança UnauthorizedError se não houver sessão.
 *
 * SEMPRE use este helper em rotas API/server actions para obter `tenantId`.
 * NUNCA leia tenantId direto do request — sessão é a única fonte de verdade.
 */
export async function requireAuth(): Promise<AuthContext> {
  const session = await auth();
  if (!session?.user?.id || !session.user.tenantId) {
    throw new UnauthorizedError();
  }
  return {
    userId: session.user.id,
    tenantId: session.user.tenantId,
    email: session.user.email ?? "",
    role: session.user.role,
  };
}

/**
 * Exige que o usuário tenha um dos papéis listados.
 */
export async function requireRole(...allowed: Role[]): Promise<AuthContext> {
  const ctx = await requireAuth();
  if (!allowed.includes(ctx.role)) {
    throw new ForbiddenError(`Requer um dos papéis: ${allowed.join(", ")}`);
  }
  return ctx;
}
