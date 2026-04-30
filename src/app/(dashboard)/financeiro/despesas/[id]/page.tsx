import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/tenant";
import { DespesaEditForm } from "./form";

export default async function DespesaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await requireAuth();
  const { id } = await params;

  const despesa = await prisma.despesa.findFirst({
    where: { id, tenantId: ctx.tenantId },
  });

  if (!despesa) notFound();

  const galpoes = await prisma.galpao.findMany({
    where: { tenantId: ctx.tenantId },
    select: { id: true, nome: true, cidade: true, estado: true },
    orderBy: { nome: "asc" },
  });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Despesa</h1>
        <p className="text-sm text-slate-500">{despesa.descricao}</p>
      </div>
      <DespesaEditForm
        despesa={{
          id: despesa.id,
          galpaoId: despesa.galpaoId ?? "",
          descricao: despesa.descricao,
          categoria: despesa.categoria,
          competencia: despesa.competencia.toISOString().slice(0, 10),
          vencimento: despesa.vencimento.toISOString().slice(0, 10),
          valor: Number(despesa.valor),
          pago: despesa.pago,
          dataPagamento: despesa.dataPagamento
            ? despesa.dataPagamento.toISOString().slice(0, 10)
            : "",
          observacoes: despesa.observacoes ?? "",
        }}
        galpoes={galpoes}
        canDelete={ctx.role === "ADMIN" || ctx.role === "GESTOR"}
      />
    </div>
  );
}
