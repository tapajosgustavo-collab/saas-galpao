import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireRole } from "@/lib/tenant";
import { galpaoCreateSchema } from "@/lib/validators/galpao";
import { apiError } from "@/lib/api";
import { Role } from "@prisma/client";

export async function GET() {
  try {
    const ctx = await requireAuth();
    const galpoes = await prisma.galpao.findMany({
      where: { tenantId: ctx.tenantId },
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { contratos: { where: { status: "ATIVO" } } } },
      },
    });
    return NextResponse.json(galpoes);
  } catch (e) {
    return apiError(e);
  }
}

export async function POST(req: Request) {
  try {
    const ctx = await requireRole(Role.ADMIN, Role.GESTOR);
    const body = await req.json();
    const data = galpaoCreateSchema.parse(body);

    const galpao = await prisma.galpao.create({
      data: { ...data, tenantId: ctx.tenantId },
    });
    return NextResponse.json(galpao, { status: 201 });
  } catch (e) {
    return apiError(e);
  }
}
