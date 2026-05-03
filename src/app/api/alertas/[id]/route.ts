import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/tenant";
import { apiError } from "@/lib/api";

/**
 * PATCH /api/alertas/[id]  body: { lido: boolean }
 * Marca um alerta como lido/nao lido.
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const ctx = await requireAuth();
    const { id } = await params;
    const body = (await req.json().catch(() => ({}))) as { lido?: boolean };
    const lido = body.lido !== false; // default true

    const result = await prisma.alerta.updateMany({
      where: { id, tenantId: ctx.tenantId },
      data: { lido },
    });
    if (result.count === 0) {
      return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return apiError(e);
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const ctx = await requireAuth();
    const { id } = await params;
    const result = await prisma.alerta.deleteMany({
      where: { id, tenantId: ctx.tenantId },
    });
    if (result.count === 0) {
      return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return apiError(e);
  }
}
