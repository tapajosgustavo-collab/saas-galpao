import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/tenant";
import { receitaPagarSchema } from "@/lib/validators/financeiro";
import { apiError } from "@/lib/api";
import { Role, StatusPagamento } from "@prisma/client";

/**
 * Marca uma receita como PAGA.
 * Acao dedicada (em vez de PATCH genérico) pra clareza no front e auditoria.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const ctx = await requireRole(Role.ADMIN, Role.GESTOR, Role.FINANCEIRO);
    const { id } = await params;
    const body = await req.json();
    const data = receitaPagarSchema.parse(body);

    const result = await prisma.receita.updateMany({
      where: { id, tenantId: ctx.tenantId },
      data: {
        valorPago: data.valorPago,
        dataPagamento: data.dataPagamento,
        status: StatusPagamento.PAGO,
      },
    });
    if (result.count === 0) {
      return NextResponse.json({ error: "Não encontrada" }, { status: 404 });
    }
    const updated = await prisma.receita.findUnique({ where: { id } });
    return NextResponse.json(updated);
  } catch (e) {
    return apiError(e);
  }
}
