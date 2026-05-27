import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiKey } from "@/lib/api-key";
import { apiError } from "@/lib/api";
import { receitaPagarSchema } from "@/lib/validators/financeiro";
import { StatusPagamento } from "@prisma/client";

/**
 * POST /api/v1/receitas/[id]/pagar
 * body: { valorPago: number, dataPagamento: ISO date }
 *
 * Caso classico de uso: TOTVS recebe Pix do cliente, dispara essa chamada
 * pra marcar a receita como PAGA no SaaS Galpao automaticamente.
 *
 * Status inferido:
 *   valorPago >= valor → PAGO
 *   0 < valorPago < valor → PARCIAL
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const ctx = await requireApiKey(req);
    const { id } = await params;
    const body = await req.json();
    const data = receitaPagarSchema.parse(body);

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
    return NextResponse.json({ data: updated, _statusInferido: status });
  } catch (e) {
    return apiError(e);
  }
}
