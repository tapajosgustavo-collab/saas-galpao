import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireRole } from "@/lib/tenant";
import { galpaoUpdateSchema } from "@/lib/validators/galpao";
import { apiError } from "@/lib/api";
import { Role } from "@prisma/client";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const ctx = await requireAuth();
    const { id } = await params;
    const galpao = await prisma.galpao.findFirst({
      where: { id, tenantId: ctx.tenantId },
      include: { contratos: { where: { status: "ATIVO" } } },
    });
    if (!galpao) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
    return NextResponse.json(galpao);
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
    const data = galpaoUpdateSchema.parse(body);

    const result = await prisma.galpao.updateMany({
      where: { id, tenantId: ctx.tenantId },
      data,
    });
    if (result.count === 0) {
      return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
    }
    const updated = await prisma.galpao.findUnique({ where: { id } });
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
    const result = await prisma.galpao.deleteMany({
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
