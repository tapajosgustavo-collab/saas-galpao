import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/tenant";
import { ReceitaEditForm } from "./form";

export default async function ReceitaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await requireAuth();
  const { id } = await params;

  const receita = await prisma.receita.findFirst({
    where: { id, tenantId: ctx.tenantId },
    include: {
      contrato: {
        select: {
          numero: true,
          empresaLocataria: true,
          galpao: { select: { nome: true } },
        },
      },
    },
  });

  if (!receita) notFound();

  const contratos = await prisma.contrato.findMany({
    where: { tenantId: ctx.tenantId },
    select: { id: true, numero: true, empresaLocataria: true },
    orderBy: { numero: "asc" },
  });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Receita</h1>
        <p className="text-sm text-slate-500">
          Contrato {receita.contrato.numero} —{" "}
          {receita.contrato.empresaLocataria}
        </p>
      </div>
      <ReceitaEditForm
        receita={{
          id: receita.id,
          contratoId: receita.contratoId,
          competencia: receita.competencia.toISOString().slice(0, 10),
          vencimento: receita.vencimento.toISOString().slice(0, 10),
          valor: Number(receita.valor),
          valorPago:
            receita.valorPago === null ? "" : String(Number(receita.valorPago)),
          dataPagamento: receita.dataPagamento
            ? receita.dataPagamento.toISOString().slice(0, 10)
            : "",
          status: receita.status,
          observacoes: receita.observacoes ?? "",
        }}
        contratos={contratos}
        canDelete={ctx.role === "ADMIN" || ctx.role === "GESTOR"}
      />
    </div>
  );
}
