import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireRole } from "@/lib/tenant";
import { despesaCreateSchema } from "@/lib/validators/financeiro";
import { apiError } from "@/lib/api";
import { Role } from "@prisma/client";

export async function GET() {
  try {
    const ctx = await requireAuth();
    const despesas = await prisma.despesa.findMany({
      where: { tenantId: ctx.tenantId },
      orderBy: { vencimento: "desc" },
      take: 200,
    });
    return NextResponse.json(despesas);
  } catch (e) {
    return apiError(e);
  }
}

export async function POST(req: Request) {
  try {
    const ctx = await requireRole(Role.ADMIN, Role.GESTOR, Role.FINANCEIRO);
    const body = await req.json();
    const data = despesaCreateSchema.parse(body);

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

    const despesa = await prisma.despesa.create({
      data: { ...data, tenantId: ctx.tenantId },
    });
    return NextResponse.json(despesa, { status: 201 });
  } catch (e) {
    return apiError(e);
  }
}
