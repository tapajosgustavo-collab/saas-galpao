import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireRole } from "@/lib/tenant";
import { manutencaoCreateSchema } from "@/lib/validators/manutencao";
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
      select: { id: true },
    });
    if (!galpao) {
      return NextResponse.json({ error: "Galpão não encontrado" }, { status: 404 });
    }

    const manutencoes = await prisma.manutencao.findMany({
      where: { tenantId: ctx.tenantId, galpaoId: id },
      orderBy: { dataInicio: "desc" },
      include: {
        contrato: { select: { numero: true, empresaLocataria: true } },
      },
    });
    return NextResponse.json(manutencoes);
  } catch (e) {
    return apiError(e);
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const ctx = await requireRole(Role.ADMIN, Role.GESTOR);
    const { id } = await params;

    const galpao = await prisma.galpao.findFirst({
      where: { id, tenantId: ctx.tenantId },
      select: { id: true },
    });
    if (!galpao) {
      return NextResponse.json({ error: "Galpão não encontrado" }, { status: 404 });
    }

    const body = await req.json();
    const data = manutencaoCreateSchema.parse(body);

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

    const manutencao = await prisma.manutencao.create({
      data: { ...data, tenantId: ctx.tenantId, galpaoId: id },
    });
    return NextResponse.json(manutencao, { status: 201 });
  } catch (e) {
    return apiError(e);
  }
}
