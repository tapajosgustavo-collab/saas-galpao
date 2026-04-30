import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/tenant";
import { DespesaNovoForm } from "./form";

export default async function NovaDespesaPage() {
  const ctx = await requireAuth();
  const galpoes = await prisma.galpao.findMany({
    where: { tenantId: ctx.tenantId },
    select: { id: true, nome: true, cidade: true, estado: true },
    orderBy: { nome: "asc" },
  });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Nova despesa</h1>
        <p className="text-sm text-slate-500">
          Lance uma despesa (manutencao, impostos, etc). Pode ser geral ou
          vinculada a um galpao.
        </p>
      </div>
      <DespesaNovoForm galpoes={galpoes} />
    </div>
  );
}
