import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/tenant";
import { apiError } from "@/lib/api";

/**
 * POST /api/alertas/mark-all-read
 * Marca todos os alertas nao-lidos do tenant como lidos. Aceita filtro
 * opcional por tipo no body: { tipo?: string }
 */
export async function POST(req: Request) {
  try {
    const ctx = await requireAuth();
    const body = (await req.json().catch(() => ({}))) as { tipo?: string };

    const where: { tenantId: string; lido: boolean; tipo?: string } = {
      tenantId: ctx.tenantId,
      lido: false,
    };
    if (body.tipo) where.tipo = body.tipo;

    const result = await prisma.alerta.updateMany({
      where: where as Parameters<typeof prisma.alerta.updateMany>[0]["where"],
      data: { lido: true },
    });
    return NextResponse.json({ ok: true, marcados: result.count });
  } catch (e) {
    return apiError(e);
  }
}
