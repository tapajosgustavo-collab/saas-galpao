import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/tenant";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatBRL, formatDate } from "@/lib/utils";
import { FileText, AlertTriangle, Wrench } from "lucide-react";
import { GalpaoEditForm } from "./form";

export default async function GalpaoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await requireAuth();
  const { id } = await params;

  const galpao = await prisma.galpao.findFirst({
    where: { id, tenantId: ctx.tenantId },
    include: {
      contratos: {
        where: { status: "ATIVO" },
        select: {
          id: true,
          numero: true,
          empresaLocataria: true,
          dataInicio: true,
          dataFim: true,
          valorMensal: true,
        },
        orderBy: { dataFim: "asc" },
      },
      documentos: {
        select: {
          id: true,
          tipo: true,
          nome: true,
          dataValidade: true,
          alertarDiasAntes: true,
          status: true,
        },
        orderBy: { dataValidade: "asc" },
      },
    },
  });

  if (!galpao) notFound();

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const docsCriticos = galpao.documentos.filter((d) => {
    const ms = d.dataValidade.getTime() - hoje.getTime();
    const dias = Math.ceil(ms / (1000 * 60 * 60 * 24));
    return dias < 0 || dias <= d.alertarDiasAntes;
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{galpao.nome}</h1>
          <p className="text-sm text-slate-500">
            {galpao.endereco} — {galpao.cidade}/{galpao.estado}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href={`/galpoes/${id}/manutencoes`}>
              <Wrench className="h-4 w-4" />
              Manutenções
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={`/galpoes/${id}/documentos`}>
              <FileText className="h-4 w-4" />
              Documentos ({galpao.documentos.length})
              {docsCriticos.length > 0 && (
                <Badge variant="warning" className="ml-1">
                  {docsCriticos.length} alerta
                  {docsCriticos.length === 1 ? "" : "s"}
                </Badge>
              )}
            </Link>
          </Button>
        </div>
      </div>

      {docsCriticos.length > 0 && (
        <Card className="border-amber-300 bg-amber-50">
          <CardContent className="flex items-start gap-3 py-4 text-sm">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <div className="flex-1">
              <p className="font-medium text-amber-900">
                {docsCriticos.length} documento
                {docsCriticos.length === 1 ? "" : "s"} precisa
                {docsCriticos.length === 1 ? "" : "m"} de atencao
              </p>
              <ul className="mt-1 space-y-0.5 text-xs text-amber-800">
                {docsCriticos.map((d) => (
                  <li key={d.id}>
                    {d.tipo.replace("_", " ")} — {d.nome} (vence{" "}
                    {formatDate(d.dataValidade)})
                  </li>
                ))}
              </ul>
              <Link
                href={`/galpoes/${id}/documentos`}
                className="mt-2 inline-block text-xs font-medium text-amber-900 hover:underline"
              >
                Ver todos os documentos →
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      <GalpaoEditForm
        galpao={{
          id: galpao.id,
          nome: galpao.nome,
          endereco: galpao.endereco,
          cidade: galpao.cidade,
          estado: galpao.estado,
          cep: galpao.cep,
          tipo: galpao.tipo,
          status: galpao.status,
          metragemTotal: Number(galpao.metragemTotal),
          metragemDisponivel: Number(galpao.metragemDisponivel),
          valorPorM2: Number(galpao.valorPorM2),
          observacoes: galpao.observacoes ?? "",
        }}
        canDelete={ctx.role === "ADMIN"}
        hasActiveContracts={galpao.contratos.length > 0}
      />

      {galpao.contratos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Contratos ativos ({galpao.contratos.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              {galpao.contratos.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between border-b pb-2 last:border-0"
                >
                  <div>
                    <p className="font-medium">{c.empresaLocataria}</p>
                    <p className="text-xs text-slate-500">
                      {c.numero} · {formatDate(c.dataInicio)} a {formatDate(c.dataFim)}
                    </p>
                  </div>
                  <span className="font-medium">
                    {formatBRL(Number(c.valorMensal))}/mês
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
