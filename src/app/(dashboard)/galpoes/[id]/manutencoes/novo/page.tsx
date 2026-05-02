import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/tenant";
import { ManutencaoForm } from "../form";

export default async function NovaManutencaoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await requireAuth();
  const { id } = await params;
  const galpao = await prisma.galpao.findFirst({
    where: { id, tenantId: ctx.tenantId },
    select: { id: true, nome: true },
  });
  if (!galpao) notFound();

  // Contratos do galpao para vincular (opcional)
  const contratos = await prisma.contrato.findMany({
    where: { tenantId: ctx.tenantId, galpaoId: id },
    select: {
      id: true,
      numero: true,
      empresaLocataria: true,
      status: true,
    },
    orderBy: { dataInicio: "desc" },
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <p className="text-xs text-slate-500">
          <Link href={`/galpoes/${id}/manutencoes`} className="hover:underline">
            ← Voltar
          </Link>
        </p>
        <h1 className="text-3xl font-bold">Nova manutenção</h1>
        <p className="text-sm text-slate-500">{galpao.nome}</p>
      </div>
      <ManutencaoForm galpaoId={id} mode="create" contratos={contratos} />
    </div>
  );
}
