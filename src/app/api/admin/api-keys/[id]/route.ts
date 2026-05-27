import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/tenant";
import { apiError } from "@/lib/api";
import { Role } from "@prisma/client";

/**
 * DELETE /api/admin/api-keys/[id]
 * Revoga uma chave (marca revokedAt). Nao deleta — preserva audit trail.
 */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const ctx = await requireRole(Role.ADMIN);
    const { id } = await params;
    const result = await prisma.apiKey.updateMany({
      where: { id, tenantId: ctx.tenantId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    if (result.count === 0) {
      return NextResponse.json({ error: "Não encontrada ou já revogada" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return apiError(e);
  }
}
