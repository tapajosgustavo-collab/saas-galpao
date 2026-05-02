import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/tenant";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { Plus, FileText, AlertTriangle } from "lucide-react";

const TIPO_LABEL: Record<string, string> = {
  AVCB: "AVCB (Bombeiros)",
  LICENCA_AMBIENTAL: "Licença Ambiental",
  ALVARA_FUNCIONAMENTO: "Alvará de Funcionamento",
  IPTU: "IPTU",
  LAUDO_TECNICO: "Laudo Técnico",
  ANALISE_POTABILIDADE: "Análise de Potabilidade",
  PGRS: "PGRS (Resíduos)",
  OUTROS: "Outros",
};

const STATUS_VARIANT: Record<string, "success" | "warning" | "destructive" | "secondary"> = {
  VIGENTE: "success",
  PROXIMO_VENCIMENTO: "warning",
  VENCIDO: "destructive",
  EM_RENOVACAO: "warning",
  NAO_APLICA: "secondary",
};

function classificarVigencia(dataValidade: Date, alertarDiasAntes: number) {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const ms = dataValidade.getTime() - hoje.getTime();
  const dias = Math.ceil(ms / (1000 * 60 * 60 * 24));
  if (dias < 0) return { label: `Vencido há ${Math.abs(dias)}d`, vencido: true, alerta: false };
  if (dias <= alertarDiasAntes)
    return { label: `Vence em ${dias}d`, vencido: false, alerta: true };
  return { label: `Vence em ${dias}d`, vencido: false, alerta: false };
}

export default async function DocumentosGalpaoPage({
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

  const documentos = await prisma.documentoGalpao.findMany({
    where: { tenantId: ctx.tenantId, galpaoId: id },
    orderBy: { dataValidade: "asc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-500">
            <Link href={`/galpoes/${id}`} className="hover:underline">
              ← Voltar ao galpão
            </Link>
          </p>
          <h1 className="text-3xl font-bold">Documentos</h1>
          <p className="text-sm text-slate-500">
            {galpao.nome} — {documentos.length} documento
            {documentos.length === 1 ? "" : "s"} cadastrado
            {documentos.length === 1 ? "" : "s"}
          </p>
        </div>
        <Button asChild>
          <Link href={`/galpoes/${id}/documentos/novo`}>
            <Plus className="h-4 w-4" /> Novo documento
          </Link>
        </Button>
      </div>

      {documentos.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-slate-500">
            <FileText className="mx-auto mb-3 h-8 w-8 text-slate-300" />
            Nenhum documento cadastrado.{" "}
            <Link
              href={`/galpoes/${id}/documentos/novo`}
              className="text-primary hover:underline"
            >
              Cadastrar AVCB, IPTU, licenças...
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Lista</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b text-left text-slate-500">
                  <tr>
                    <th className="pb-2 font-medium">Tipo</th>
                    <th className="pb-2 font-medium">Nome</th>
                    <th className="pb-2 font-medium">Validade</th>
                    <th className="pb-2 font-medium">Resp. pagamento</th>
                    <th className="pb-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {documentos.map((d) => {
                    const v = classificarVigencia(d.dataValidade, d.alertarDiasAntes);
                    const isIPTU = d.tipo === "IPTU";
                    return (
                      <tr
                        key={d.id}
                        className="cursor-pointer border-b transition-colors last:border-0 hover:bg-slate-50"
                      >
                        <td className="py-3">
                          <Link
                            href={`/galpoes/${id}/documentos/${d.id}`}
                            className="block font-medium"
                          >
                            {TIPO_LABEL[d.tipo] ?? d.tipo}
                          </Link>
                        </td>
                        <td className="py-3 text-slate-600">
                          <Link
                            href={`/galpoes/${id}/documentos/${d.id}`}
                            className="block w-full"
                          >
                            {d.nome}
                            {d.numero && (
                              <span className="ml-1 font-mono text-xs text-slate-400">
                                #{d.numero}
                              </span>
                            )}
                          </Link>
                        </td>
                        <td className="py-3">
                          <Link
                            href={`/galpoes/${id}/documentos/${d.id}`}
                            className="block w-full"
                          >
                            <span className="flex items-center gap-1">
                              {formatDate(d.dataValidade)}
                              {(v.alerta || v.vencido) && (
                                <AlertTriangle
                                  className={`h-3 w-3 ${v.vencido ? "text-red-500" : "text-amber-500"}`}
                                />
                              )}
                            </span>
                            <span
                              className={`text-xs ${v.vencido ? "text-red-600" : v.alerta ? "text-amber-600" : "text-slate-400"}`}
                            >
                              {v.label}
                            </span>
                          </Link>
                        </td>
                        <td className="py-3 text-xs">
                          <Link
                            href={`/galpoes/${id}/documentos/${d.id}`}
                            className="block w-full"
                          >
                            {isIPTU
                              ? d.responsavelPagamento ?? "—"
                              : d.responsavelPagamento ?? ""}
                          </Link>
                        </td>
                        <td className="py-3">
                          <Link
                            href={`/galpoes/${id}/documentos/${d.id}`}
                            className="block w-full"
                          >
                            <Badge variant={STATUS_VARIANT[d.status] ?? "secondary"}>
                              {d.status.replace("_", " ")}
                            </Badge>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
