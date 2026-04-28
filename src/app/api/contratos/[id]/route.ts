import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireRole } from "@/lib/tenant";
import { contratoUpdateSchema } from "@/lib/validators/contrato";
import { apiError } from "@/lib/api";
import { Role } from "@prisma/client";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const ctx = await requireAuth();
    const { id } = await params;
    const contrato = await prisma.contrato.findFirst({
      where: { id, tenantId: ctx.tenantId },
      include: { galpao: true, receitas: { orderBy: { vencimento: "desc" } } },
    });
    if (!contrato) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
    return NextResponse.json(contrato);
  } catch (e) {
    return apiError(e);
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const ctx = await requireRole(Role.ADMIN, Role.GESTOR);
    const { id } = await params;
    const body = await req.json();
    const data = contratoUpdateSchema.parse(body);

    // Se trocando galpaoId, validar que pertence ao mesmo tenant
    if (data.galpaoId) {
      const galpao = await prisma.galpao.findFirst({
        where: { id: data.galpaoId, tenantId: ctx.tenantId },
        select: { id: true },
      });
      if (!galpao) {
        return NextResponse.json(
          { error: "Galpão não encontrado neste tenant" },
          { status: 404 },
        );
      }
    }

    const result = await prisma.contrato.updateMany({
      where: { id, tenantId: ctx.tenantId },
      data,
    });
    if (result.count === 0) {
      return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
    }
    const updated = await prisma.contrato.findUnique({ where: { id } });
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
    const ctx = await requireRole(Role.ADMIN);
    const { id } = await params;
    const result = await prisma.contrato.deleteMany({
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
