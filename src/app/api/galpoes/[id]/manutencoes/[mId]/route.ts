import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireRole } from "@/lib/tenant";
import { manutencaoUpdateSchema } from "@/lib/validators/manutencao";
import { apiError } from "@/lib/api";
import { Role } from "@prisma/client";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string; mId: string }> },
) {
  try {
    const ctx = await requireAuth();
    const { id, mId } = await params;
    const m = await prisma.manutencao.findFirst({
      where: { id: mId, galpaoId: id, tenantId: ctx.tenantId },
      include: {
        contrato: { select: { numero: true, empresaLocataria: true } },
      },
    });
    if (!m) return NextResponse.json({ error: "Não encontrada" }, { status: 404 });
    return NextResponse.json(m);
  } catch (e) {
    return apiError(e);
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; mId: string }> },
) {
  try {
    const ctx = await requireRole(Role.ADMIN, Role.GESTOR);
    const { id, mId } = await params;
    const body = await req.json();
    const data = manutencaoUpdateSchema.parse(body);

    if (data.contratoId) {
      const c = await prisma.contrato.findFirst({
        where: { id: data.contratoId, tenantId: ctx.tenantId, galpaoId: id },
        select: { id: true },
      });
      if (!c) {
        return NextResponse.json(
          { error: "Contrato nao pertence a este galpao/tenant" },
          { status: 404 },
        );
      }
    }

    const result = await prisma.manutencao.updateMany({
      where: { id: mId, galpaoId: id, tenantId: ctx.tenantId },
      data,
    });
    if (result.count === 0) {
      return NextResponse.json({ error: "Não encontrada" }, { status: 404 });
    }
    const updated = await prisma.manutencao.findUnique({ where: { id: mId } });
    return NextResponse.json(updated);
  } catch (e) {
    return apiError(e);
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; mId: string }> },
) {
  try {
    const ctx = await requireRole(Role.ADMIN);
    const { id, mId } = await params;
    const result = await prisma.manutencao.deleteMany({
      where: { id: mId, galpaoId: id, tenantId: ctx.tenantId },
    });
    if (result.count === 0) {
      return NextResponse.json({ error: "Não encontrada" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return apiError(e);
  }
}
