import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/tenant";
import { apiError } from "@/lib/api";
import { generateApiKey } from "@/lib/api-key";
import { requireApiAccess } from "@/lib/plan-limits";
import { Role } from "@prisma/client";

const createSchema = z.object({
  name: z.string().min(2).max(120),
  expiresAt: z.coerce.date().optional().nullable(),
});

/**
 * GET /api/admin/api-keys
 * Lista as keys do tenant atual (sem mostrar a chave bruta — nem temos).
 */
export async function GET() {
  try {
    const ctx = await requireRole(Role.ADMIN);
    await requireApiAccess(ctx.tenantId);
    const keys = await prisma.apiKey.findMany({
      where: { tenantId: ctx.tenantId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        lastUsedAt: true,
        expiresAt: true,
        revokedAt: true,
        createdAt: true,
      },
    });
    return NextResponse.json({ data: keys });
  } catch (e) {
    return apiError(e);
  }
}

/**
 * POST /api/admin/api-keys
 * Gera nova chave. Devolve a chave bruta UMA UNICA VEZ.
 */
export async function POST(req: Request) {
  try {
    const ctx = await requireRole(Role.ADMIN);
    await requireApiAccess(ctx.tenantId);
    const body = await req.json();
    const data = createSchema.parse(body);

    const { raw, hash, prefix } = generateApiKey();
    const key = await prisma.apiKey.create({
      data: {
        tenantId: ctx.tenantId,
        name: data.name,
        keyHash: hash,
        keyPrefix: prefix,
        expiresAt: data.expiresAt ?? null,
        createdById: ctx.userId,
      },
      select: { id: true, name: true, keyPrefix: true, createdAt: true, expiresAt: true },
    });

    // ATENCAO: raw devolvido SO AGORA. Cliente precisa salvar.
    return NextResponse.json(
      { data: { ...key, key: raw, message: "Salve essa chave agora. Nao podera ser recuperada." } },
      { status: 201 },
    );
  } catch (e) {
    return apiError(e);
  }
}
