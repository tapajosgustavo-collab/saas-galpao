import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireRole } from "@/lib/tenant";
import { receitaUpdateSchema } from "@/lib/validators/financeiro";
import { apiError } from "@/lib/api";
import { Role } from "@prisma/client";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const ctx = await requireAuth();
    const { id } = await params;
    const receita = await prisma.receita.findFirst({
      where: { id, tenantId: ctx.tenantId },
      include: { contrato: { select: { numero: true, empresaLocataria: true } } },
    });
    if (!receita) {
      return NextResponse.json({ error: "Não encontrada" }, { status: 404 });
    }
    return NextResponse.json(receita);
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
    const data = receitaUpdateSchema.parse(body);

    if (data.contratoId) {
      const c = await prisma.contrato.findFirst({
        where: { id: data.contratoId, tenantId: ctx.tenantId },
        select: { id: true },
      });
      if (!c) {
        return NextResponse.json(
          { error: "Contrato não pertence a este tenant" },
          { status: 404 },
        );
      }
    }

    const result = await prisma.receita.updateMany({
      where: { id, tenantId: ctx.tenantId },
      data,
    });
    if (result.count === 0) {
      return NextResponse.json({ error: "Não encontrada" }, { status: 404 });
    }
    const updated = await prisma.receita.findUnique({ where: { id } });
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
    const result = await prisma.receita.deleteMany({
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
