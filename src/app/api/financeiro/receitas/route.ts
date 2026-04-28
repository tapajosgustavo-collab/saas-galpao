import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireRole } from "@/lib/tenant";
import { receitaCreateSchema } from "@/lib/validators/financeiro";
import { apiError } from "@/lib/api";
import { Role } from "@prisma/client";

export async function GET() {
  try {
    const ctx = await requireAuth();
    const receitas = await prisma.receita.findMany({
      where: { tenantId: ctx.tenantId },
      orderBy: { vencimento: "desc" },
      include: {
        contrato: { select: { numero: true, empresaLocataria: true } },
      },
      take: 200,
    });
    return NextResponse.json(receitas);
  } catch (e) {
    return apiError(e);
  }
}

export async function POST(req: Request) {
  try {
    const ctx = await requireRole(Role.ADMIN, Role.GESTOR, Role.FINANCEIRO);
    const body = await req.json();
    const data = receitaCreateSchema.parse(body);

    const contrato = await prisma.contrato.findFirst({
      where: { id: data.contratoId, tenantId: ctx.tenantId },
      select: { id: true },
    });
    if (!contrato) {
      return NextResponse.json(
        { error: "Contrato não encontrado neste tenant" },
        { status: 404 },
      );
    }

    const receita = await prisma.receita.create({
      data: { ...data, tenantId: ctx.tenantId },
    });
    return NextResponse.json(receita, { status: 201 });
  } catch (e) {
    return apiError(e);
  }
}
