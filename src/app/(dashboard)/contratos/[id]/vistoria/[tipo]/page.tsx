import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/tenant";
import { TipoVistoria } from "@prisma/client";
import { VistoriaForm } from "./form";

export default async function VistoriaTipoPage({
  params,
}: {
  params: Promise<{ id: string; tipo: string }>;
}) {
  const ctx = await requireAuth();
  const { id, tipo: tipoParam } = await params;

  const tipoUpper = tipoParam.toUpperCase();
  if (tipoUpper !== "INICIAL" && tipoUpper !== "FINAL") notFound();
  const tipo = tipoUpper as TipoVistoria;

  const contrato = await prisma.contrato.findFirst({
    where: { id, tenantId: ctx.tenantId },
    include: { galpao: { select: { nome: true } } },
  });
  if (!contrato) notFound();

  const vistoria = await prisma.vistoria.findUnique({
    where: { contratoId_tipo: { contratoId: id, tipo } },
    include: { itens: { orderBy: { ordem: "asc" } } },
  });

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <p className="text-xs text-slate-500">
          <Link href={`/contratos/${id}/vistoria`} className="hover:underline">
            ← Voltar para Vistorias
          </Link>
        </p>
        <h1 className="text-3xl font-bold">
          Vistoria {tipo === "INICIAL" ? "Inicial" : "Final"}
        </h1>
        <p className="text-sm text-slate-500">
          {contrato.numero} · {contrato.empresaLocataria} · {contrato.galpao.nome}
        </p>
      </div>

      <VistoriaForm
        contratoId={id}
        tipo={tipo}
        canDelete={ctx.role === "ADMIN"}
        vistoria={
          vistoria
            ? {
                id: vistoria.id,
                dataVistoria: vistoria.dataVistoria.toISOString().slice(0, 10),
                responsavelInterno: vistoria.responsavelInterno ?? "",
                responsavelLocataria: vistoria.responsavelLocataria ?? "",
                cpfLocataria: vistoria.cpfLocataria ?? "",
                observacoesGerais: vistoria.observacoesGerais ?? "",
                fotosGerais: vistoria.fotosGerais,
                status: vistoria.status,
                documentoUrl: vistoria.documentoUrl ?? "",
                itens: vistoria.itens.map((it) => ({
                  area: it.area,
                  descricao: it.descricao ?? "",
                  condicao: it.condicao,
                  observacao: it.observacao ?? "",
                  fotos: it.fotos,
                })),
              }
            : undefined
        }
      />
    </div>
  );
}
