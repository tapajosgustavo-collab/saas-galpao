import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireRole } from "@/lib/tenant";
import { contratoCreateSchema } from "@/lib/validators/contrato";
import { apiError } from "@/lib/api";
import { Role } from "@prisma/client";

export async function GET() {
  try {
    const ctx = await requireAuth();
    const contratos = await prisma.contrato.findMany({
      where: { tenantId: ctx.tenantId },
      orderBy: { createdAt: "desc" },
      include: {
        galpao: { select: { id: true, nome: true, cidade: true, estado: true } },
      },
    });
    return NextResponse.json(contratos);
  } catch (e) {
    return apiError(e);
  }
}

export async function POST(req: Request) {
  try {
    const ctx = await requireRole(Role.ADMIN, Role.GESTOR);
    const body = await req.json();
    const data = contratoCreateSchema.parse(body);

    // Garantir que o galpão pertence ao mesmo tenant
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

    const contrato = await prisma.contrato.create({
      data: { ...data, tenantId: ctx.tenantId },
    });
    return NextResponse.json(contrato, { status: 201 });
  } catch (e) {
    return apiError(e);
  }
}
