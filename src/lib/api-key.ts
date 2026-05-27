import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { UnauthorizedError } from "@/lib/tenant";

// =========================================================
// Geracao e verificacao de API keys
// =========================================================

/**
 * Gera uma nova chave bruta. Formato: sk_live_<32 chars hex>
 * - Mostrada UMA VEZ ao usuario.
 * - Salvamos so o sha256(key) no banco.
 */
export function generateApiKey(): { raw: string; hash: string; prefix: string } {
  const random = crypto.randomBytes(24).toString("hex"); // 48 chars
  const raw = `sk_live_${random}`;
  const hash = crypto.createHash("sha256").update(raw).digest("hex");
  const prefix = raw.slice(0, 12); // "sk_live_xxxx" — pra display
  return { raw, hash, prefix };
}

/**
 * Hash o valor cru pra comparar com o salvo no banco.
 */
export function hashApiKey(raw: string): string {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

// =========================================================
// Middleware: extrai tenant de uma request com Bearer key
// =========================================================

export interface ApiKeyContext {
  tenantId: string;
  apiKeyId: string;
}

export async function requireApiKey(req: Request): Promise<ApiKeyContext> {
  const auth = req.headers.get("authorization");
  if (!auth || !auth.startsWith("Bearer ")) {
    throw new UnauthorizedError("Authorization header com Bearer obrigatorio");
  }
  const raw = auth.slice(7).trim();
  if (!raw.startsWith("sk_live_")) {
    throw new UnauthorizedError("Formato de chave invalido");
  }

  const hash = hashApiKey(raw);
  const key = await prisma.apiKey.findUnique({
    where: { keyHash: hash },
    select: {
      id: true,
      tenantId: true,
      revokedAt: true,
      expiresAt: true,
    },
  });

  if (!key) {
    throw new UnauthorizedError("Chave invalida");
  }
  if (key.revokedAt) {
    throw new UnauthorizedError("Chave revogada");
  }
  if (key.expiresAt && key.expiresAt < new Date()) {
    throw new UnauthorizedError("Chave expirada");
  }

  // Atualiza lastUsedAt em background (nao bloqueia request)
  prisma.apiKey
    .update({
      where: { id: key.id },
      data: { lastUsedAt: new Date() },
    })
    .catch((e) => console.error("[api-key] falha ao atualizar lastUsedAt:", e));

  return { tenantId: key.tenantId, apiKeyId: key.id };
}
