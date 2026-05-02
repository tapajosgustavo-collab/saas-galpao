import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/tenant";
import { ManutencaoForm } from "../form";

export default async function ManutencaoDetailPage({
  params,
}: {
  params: Promise<{ id: string; mId: string }>;
}) {
  const ctx = await requireAuth();
  const { id, mId } = await params;

  const m = await prisma.manutencao.findFirst({
    where: { id: mId, galpaoId: id, tenantId: ctx.tenantId },
    include: { galpao: { select: { nome: true } } },
  });
  if (!m) notFound();

  const contratos = await prisma.contrato.findMany({
    where: { tenantId: ctx.tenantId, galpaoId: id },
    select: { id: true, numero: true, empresaLocataria: true, status: true },
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
        <h1 className="text-3xl font-bold">Manutenção</h1>
        <p className="text-sm text-slate-500">
          {m.galpao.nome} · {m.descricao.slice(0, 80)}
          {m.descricao.length > 80 ? "..." : ""}
        </p>
      </div>
      <ManutencaoForm
        galpaoId={id}
        mode="edit"
        canDelete={ctx.role === "ADMIN"}
        contratos={contratos}
        manutencao={{
          id: m.id,
          contratoId: m.contratoId ?? "",
          tipo: m.tipo,
          categoria: m.categoria,
          descricao: m.descricao,
          prestador: m.prestador,
          prestadorContato: m.prestadorContato ?? "",
          prestadorCnpj: m.prestadorCnpj ?? "",
          dataInicio: m.dataInicio.toISOString().slice(0, 10),
          dataFim: m.dataFim ? m.dataFim.toISOString().slice(0, 10) : "",
          valor: Number(m.valor),
          pagoPor: m.pagoPor ?? "",
          status: m.status,
          fotosAntes: m.fotosAntes,
          fotosDepois: m.fotosDepois,
          notaFiscalUrl: m.notaFiscalUrl ?? "",
          observacoes: m.observacoes ?? "",
        }}
      />
    </div>
  );
}
