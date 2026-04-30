import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/tenant";
import { ReceitaNovoForm } from "./form";

export default async function NovaReceitaPage() {
  const ctx = await requireAuth();
  const contratos = await prisma.contrato.findMany({
    where: { tenantId: ctx.tenantId, status: "ATIVO" },
    select: {
      id: true,
      numero: true,
      empresaLocataria: true,
      valorMensal: true,
      diaVencimento: true,
    },
    orderBy: { numero: "asc" },
  });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Nova receita</h1>
        <p className="text-sm text-slate-500">
          Lance uma cobranca avulsa vinculada a um contrato ativo.
        </p>
      </div>
      <ReceitaNovoForm
        contratos={contratos.map((c) => ({
          id: c.id,
          label: `${c.numero} — ${c.empresaLocataria}`,
          valorMensal: Number(c.valorMensal),
          diaVencimento: c.diaVencimento,
        }))}
      />
    </div>
  );
}
