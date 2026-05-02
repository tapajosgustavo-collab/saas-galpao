import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireRole } from "@/lib/tenant";
import { vistoriaCreateSchema } from "@/lib/validators/vistoria";
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
      select: { id: true },
    });
    if (!contrato) {
      return NextResponse.json({ error: "Contrato não encontrado" }, { status: 404 });
    }

    const vistorias = await prisma.vistoria.findMany({
      where: { tenantId: ctx.tenantId, contratoId: id },
      include: { itens: { orderBy: { ordem: "asc" } } },
      orderBy: { tipo: "asc" },
    });
    return NextResponse.json(vistorias);
  } catch (e) {
    return apiError(e);
  }
}

/**
 * Cria uma vistoria com seus itens em uma transacao.
 * O unique [contratoId, tipo] impede duplicatas.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const ctx = await requireRole(Role.ADMIN, Role.GESTOR);
    const { id } = await params;

    const contrato = await prisma.contrato.findFirst({
      where: { id, tenantId: ctx.tenantId },
      select: { id: true },
    });
    if (!contrato) {
      return NextResponse.json({ error: "Contrato não encontrado" }, { status: 404 });
    }

    const body = await req.json();
    const data = vistoriaCreateSchema.parse(body);

    const { itens, ...vistoriaData } = data;

    const created = await prisma.vistoria.create({
      data: {
        ...vistoriaData,
        tenantId: ctx.tenantId,
        contratoId: id,
        itens: {
          create: itens.map((it, idx) => ({ ...it, ordem: it.ordem ?? idx })),
        },
      },
      include: { itens: { orderBy: { ordem: "asc" } } },
    });
    return NextResponse.json(created, { status: 201 });
  } catch (e) {
    return apiError(e);
  }
}
