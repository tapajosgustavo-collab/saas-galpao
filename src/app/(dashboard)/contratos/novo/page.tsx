import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/tenant";
import { ContratoForm } from "./form";

export default async function NovoContratoPage() {
  const ctx = await requireAuth();
  const galpoes = await prisma.galpao.findMany({
    where: { tenantId: ctx.tenantId, status: { in: ["DISPONIVEL", "EM_NEGOCIACAO"] } },
    select: { id: true, nome: true, cidade: true, estado: true },
    orderBy: { nome: "asc" },
  });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-3xl font-bold">Novo contrato</h1>
      <ContratoForm galpoes={galpoes} />
    </div>
  );
}
