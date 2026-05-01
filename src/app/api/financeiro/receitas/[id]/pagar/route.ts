import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/tenant";
import { receitaPagarSchema } from "@/lib/validators/financeiro";
import { apiError } from "@/lib/api";
import { Role, StatusPagamento } from "@prisma/client";

/**
 * Registra pagamento de uma receita.
 * Status e inferido automaticamente comparando valorPago com valor da receita:
 *  - valorPago >= valor → PAGO
 *  - 0 < valorPago < valor → PARCIAL
 * Endpoint dedicado em vez de PATCH genérico para auditoria mais clara.
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

    // Busca o valor da receita pra decidir se foi pagamento integral ou parcial
    const receita = await prisma.receita.findFirst({
      where: { id, tenantId: ctx.tenantId },
      select: { valor: true },
    });
    if (!receita) {
      return NextResponse.json({ error: "Não encontrada" }, { status: 404 });
    }

    const valorTotal = Number(receita.valor);
    const status: StatusPagamento =
      data.valorPago >= valorTotal
        ? StatusPagamento.PAGO
        : StatusPagamento.PARCIAL;

    await prisma.receita.update({
      where: { id },
      data: {
        valorPago: data.valorPago,
        dataPagamento: data.dataPagamento,
        status,
      },
    });
    const updated = await prisma.receita.findUnique({ where: { id } });
    return NextResponse.json({ ...updated, _statusInferido: status });
  } catch (e) {
    return apiError(e);
  }
}
