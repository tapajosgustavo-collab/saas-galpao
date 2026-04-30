import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireRole } from "@/lib/tenant";
import { despesaUpdateSchema } from "@/lib/validators/financeiro";
import { apiError } from "@/lib/api";
import { Role } from "@prisma/client";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const ctx = await requireAuth();
    const { id } = await params;
    const despesa = await prisma.despesa.findFirst({
      where: { id, tenantId: ctx.tenantId },
    });
    if (!despesa) {
      return NextResponse.json({ error: "Não encontrada" }, { status: 404 });
    }
    return NextResponse.json(despesa);
  } catch (e) {
    return apiError(e);
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const ctx = await requireRole(Role.ADMIN, Role.GESTOR, Role.FINANCEIRO);
    const { id } = await params;
    const body = await req.json();
    const data = despesaUpdateSchema.parse(body);

    if (data.galpaoId) {
      const g = await prisma.galpao.findFirst({
        where: { id: data.galpaoId, tenantId: ctx.tenantId },
        select: { id: true },
      });
      if (!g) {
        return NextResponse.json(
          { error: "Galpão não pertence a este tenant" },
          { status: 404 },
        );
      }
    }

    const result = await prisma.despesa.updateMany({
      where: { id, tenantId: ctx.tenantId },
      data,
    });
    if (result.count === 0) {
      return NextResponse.json({ error: "Não encontrada" }, { status: 404 });
    }
    const updated = await prisma.despesa.findUnique({ where: { id } });
    return NextResponse.json(updated);
  } catch (e) {
    return apiError(e);
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const ctx = await requireRole(Role.ADMIN, Role.GESTOR);
    const { id } = await params;
    const result = await prisma.despesa.deleteMany({
      where: { id, tenantId: ctx.tenantId },
    });
    if (result.count === 0) {
      return NextResponse.json({ error: "Não encontrada" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return apiError(e);
  }
}
