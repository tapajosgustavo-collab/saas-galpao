import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiKey } from "@/lib/api-key";
import { apiError } from "@/lib/api";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const ctx = await requireApiKey(req);
    const { id } = await params;
    const contrato = await prisma.contrato.findFirst({
      where: { id, tenantId: ctx.tenantId },
      include: { galpao: true, receitas: { orderBy: { vencimento: "desc" }, take: 24 } },
    });
    if (!contrato) {
      return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
    }
    return NextResponse.json({ data: contrato });
  } catch (e) {
    return apiError(e);
  }
}
