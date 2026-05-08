import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/tenant";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExportButton } from "@/components/export-button";
import { formatBRL, formatDate } from "@/lib/utils";
import { Plus, Wrench } from "lucide-react";

const STATUS_VARIANT: Record<string, "success" | "warning" | "destructive" | "secondary"> = {
  AGENDADA: "warning",
  EM_ANDAMENTO: "warning",
  CONCLUIDA: "success",
  CANCELADA: "secondary",
};

const TIPO_LABEL: Record<string, string> = {
  PREVENTIVA: "Preventiva",
  CORRETIVA: "Corretiva",
  EMERGENCIAL: "Emergencial",
};

const CATEGORIA_LABEL: Record<string, string> = {
  ELETRICA: "Elétrica",
  HIDRAULICA: "Hidráulica",
  ESTRUTURAL: "Estrutural",
  COBERTURA: "Cobertura",
  PINTURA: "Pintura",
  PORTAS_PORTOES: "Portas/Portões",
  PISO: "Piso",
  CLIMATIZACAO: "Climatização",
  SEGURANCA: "Segurança",
  LIMPEZA: "Limpeza",
  OUTROS: "Outros",
};

export default async function ManutencoesPage({
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

  const manutencoes = await prisma.manutencao.findMany({
    where: { tenantId: ctx.tenantId, galpaoId: id },
    orderBy: { dataInicio: "desc" },
    include: {
      contrato: { select: { numero: true, empresaLocataria: true } },
    },
  });

  // Resumo dos ultimos 12 meses
  const inicioJanela = new Date();
  inicioJanela.setMonth(inicioJanela.getMonth() - 12);
  const recentes = manutencoes.filter((m) => m.dataInicio >= inicioJanela);
  const totalAno = recentes.reduce((s, m) => s + Number(m.valor), 0);
  const porLocador = recentes
    .filter((m) => m.pagoPor === "LOCADOR")
    .reduce((s, m) => s + Number(m.valor), 0);
  const porLocataria = recentes
    .filter((m) => m.pagoPor === "LOCATARIA")
    .reduce((s, m) => s + Number(m.valor), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-500">
            <Link href={`/galpoes/${id}`} className="hover:underline">
              ← Voltar ao galpão
            </Link>
          </p>
          <h1 className="text-3xl font-bold">Manutenções</h1>
          <p className="text-sm text-slate-500">
            {galpao.nome} — {manutencoes.length} registro
            {manutencoes.length === 1 ? "" : "s"}
          </p>
        </div>
        <div className="flex gap-2">
          {manutencoes.length > 0 && (
            <ExportButton type="manutencoes" galpaoId={id} />
          )}
          <Button asChild>
            <Link href={`/galpoes/${id}/manutencoes/novo`}>
              <Plus className="h-4 w-4" /> Nova manutenção
            </Link>
          </Button>
        </div>
      </div>

      {recentes.length > 0 && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">
                Total últimos 12 meses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{formatBRL(totalAno)}</p>
              <p className="text-xs text-slate-500">
                {recentes.length} serviço{recentes.length === 1 ? "" : "s"}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">
                Pago pelo locador
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-red-700">
                {formatBRL(porLocador)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">
                Pago pela locatária
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-700">
                {formatBRL(porLocataria)}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {manutencoes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-slate-500">
            <Wrench className="mx-auto mb-3 h-8 w-8 text-slate-300" />
            Nenhuma manutenção registrada.{" "}
            <Link
              href={`/galpoes/${id}/manutencoes/novo`}
              className="text-primary hover:underline"
            >
              Registrar a primeira
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Histórico</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b text-left text-slate-500">
                  <tr>
                    <th className="pb-2 font-medium">Data</th>
                    <th className="pb-2 font-medium">Categoria</th>
                    <th className="pb-2 font-medium">Descrição</th>
                    <th className="pb-2 font-medium">Prestador</th>
                    <th className="pb-2 font-medium">Valor</th>
                    <th className="pb-2 font-medium">Pago por</th>
                    <th className="pb-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {manutencoes.map((m) => (
                    <tr
                      key={m.id}
                      className="cursor-pointer border-b transition-colors last:border-0 hover:bg-slate-50"
                    >
                      <td className="py-3 whitespace-nowrap">
                        <Link
                          href={`/galpoes/${id}/manutencoes/${m.id}`}
                          className="block w-full"
                        >
                          {formatDate(m.dataInicio)}
                          <p className="text-xs text-slate-400">
                            {TIPO_LABEL[m.tipo] ?? m.tipo}
                          </p>
                        </Link>
                      </td>
                      <td className="py-3">
                        <Link
                          href={`/galpoes/${id}/manutencoes/${m.id}`}
                          className="block w-full"
                        >
                          {CATEGORIA_LABEL[m.categoria] ?? m.categoria}
                        </Link>
                      </td>
                      <td className="py-3">
                        <Link
                          href={`/galpoes/${id}/manutencoes/${m.id}`}
                          className="block max-w-xs truncate"
                          title={m.descricao}
                        >
                          {m.descricao}
                        </Link>
                      </td>
                      <td className="py-3 text-slate-600">
                        <Link
                          href={`/galpoes/${id}/manutencoes/${m.id}`}
                          className="block w-full"
                        >
                          {m.prestador}
                        </Link>
                      </td>
                      <td className="py-3 whitespace-nowrap">
                        <Link
                          href={`/galpoes/${id}/manutencoes/${m.id}`}
                          className="block w-full font-medium"
                        >
                          {formatBRL(Number(m.valor))}
                        </Link>
                      </td>
                      <td className="py-3 text-xs">
                        <Link
                          href={`/galpoes/${id}/manutencoes/${m.id}`}
                          className="block w-full"
                        >
                          {m.pagoPor ?? "—"}
                        </Link>
                      </td>
                      <td className="py-3">
                        <Link
                          href={`/galpoes/${id}/manutencoes/${m.id}`}
                          className="block w-full"
                        >
                          <Badge variant={STATUS_VARIANT[m.status] ?? "secondary"}>
                            {m.status.replace("_", " ")}
                          </Badge>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
