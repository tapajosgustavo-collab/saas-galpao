import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiKey } from "@/lib/api-key";
import { apiError } from "@/lib/api";
import { galpaoUpdateSchema } from "@/lib/validators/galpao";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const ctx = await requireApiKey(req);
    const { id } = await params;
    const galpao = await prisma.galpao.findFirst({
      where: { id, tenantId: ctx.tenantId },
      include: {
        contratos: { where: { status: "ATIVO" } },
      },
    });
    if (!galpao) {
      return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
    }
    return NextResponse.json({ data: galpao });
  } catch (e) {
    return apiError(e);
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const ctx = await requireApiKey(req);
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
    return NextResponse.json({ data: updated });
  } catch (e) {
    return apiError(e);
  }
}
