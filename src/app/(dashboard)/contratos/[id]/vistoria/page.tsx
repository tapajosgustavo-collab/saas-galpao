import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/tenant";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { ClipboardCheck, ArrowRight, AlertTriangle, CheckCircle2 } from "lucide-react";

const AREA_LABEL: Record<string, string> = {
  ESTRUTURA: "Estrutura",
  COBERTURA: "Cobertura",
  PISO: "Piso",
  PAREDES: "Paredes",
  PORTAS_PORTOES: "Portas/Portões",
  ELETRICA: "Elétrica",
  HIDRAULICA: "Hidráulica",
  ILUMINACAO: "Iluminação",
  CLIMATIZACAO: "Climatização",
  EXTERNO_PATIO: "Externo/Pátio",
  SEGURANCA: "Segurança",
  OUTROS: "Outros",
};

const COND_RANK: Record<string, number> = {
  BOM: 0,
  REGULAR: 1,
  RUIM: 2,
  CRITICO: 3,
  NAO_APLICA: -1,
};

const COND_VARIANT: Record<string, "success" | "warning" | "destructive" | "secondary"> = {
  BOM: "success",
  REGULAR: "warning",
  RUIM: "destructive",
  CRITICO: "destructive",
  NAO_APLICA: "secondary",
};

export default async function VistoriaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await requireAuth();
  const { id } = await params;

  const contrato = await prisma.contrato.findFirst({
    where: { id, tenantId: ctx.tenantId },
    include: {
      galpao: { select: { nome: true } },
      vistorias: {
        include: { itens: { orderBy: { ordem: "asc" } } },
        orderBy: { tipo: "asc" },
      },
    },
  });
  if (!contrato) notFound();

  const inicial = contrato.vistorias.find((v) => v.tipo === "INICIAL");
  const finalV = contrato.vistorias.find((v) => v.tipo === "FINAL");

  // Calcula divergencias entre inicial e final (se ambas existem)
  const divergencias: Array<{
    area: string;
    condIni: string;
    condFin: string;
    piorou: boolean;
  }> = [];
  if (inicial && finalV) {
    for (const itemFin of finalV.itens) {
      const itemIni = inicial.itens.find((i) => i.area === itemFin.area);
      if (!itemIni) continue;
      if (itemIni.condicao !== itemFin.condicao) {
        const piorou = COND_RANK[itemFin.condicao] > COND_RANK[itemIni.condicao];
        divergencias.push({
          area: AREA_LABEL[itemFin.area] ?? itemFin.area,
          condIni: itemIni.condicao,
          condFin: itemFin.condicao,
          piorou,
        });
      }
    }
  }
  const danos = divergencias.filter((d) => d.piorou);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs text-slate-500">
          <Link href={`/contratos/${id}`} className="hover:underline">
            ← Voltar ao contrato
          </Link>
        </p>
        <h1 className="text-3xl font-bold">Vistorias</h1>
        <p className="text-sm text-slate-500">
          {contrato.numero} · {contrato.empresaLocataria} · {contrato.galpao.nome}
        </p>
      </div>

      {/* Cards das duas vistorias */}
      <div className="grid gap-4 md:grid-cols-2">
        <VistoriaCard
          tipo="INICIAL"
          contratoId={id}
          vistoria={inicial}
        />
        <VistoriaCard
          tipo="FINAL"
          contratoId={id}
          vistoria={finalV}
        />
      </div>

      {/* Comparacao automatica se ambas existem */}
      {inicial && finalV && (
        <Card
          className={
            danos.length > 0 ? "border-red-300 bg-red-50/40" : "border-green-300 bg-green-50/40"
          }
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              {danos.length > 0 ? (
                <AlertTriangle className="h-5 w-5 text-red-600" />
              ) : (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              )}
              Comparativo Inicial × Final
            </CardTitle>
            <CardDescription>
              {danos.length > 0
                ? `${danos.length} item(s) com piora — possível dano a cobrar do locatário.`
                : divergencias.length > 0
                  ? "Mudanças detectadas, mas nenhuma piorou."
                  : "Nenhuma mudança entre vistoria inicial e final."}
            </CardDescription>
          </CardHeader>
          {divergencias.length > 0 && (
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b text-left text-slate-500">
                    <tr>
                      <th className="pb-2 font-medium">Área</th>
                      <th className="pb-2 font-medium">Inicial</th>
                      <th className="pb-2 font-medium"></th>
                      <th className="pb-2 font-medium">Final</th>
                      <th className="pb-2 font-medium">Avaliação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {divergencias.map((d, i) => (
                      <tr key={i} className="border-b last:border-0">
                        <td className="py-2 font-medium">{d.area}</td>
                        <td className="py-2">
                          <Badge variant={COND_VARIANT[d.condIni] ?? "secondary"}>
                            {d.condIni}
                          </Badge>
                        </td>
                        <td className="py-2">
                          <ArrowRight className="h-3 w-3 text-slate-400" />
                        </td>
                        <td className="py-2">
                          <Badge variant={COND_VARIANT[d.condFin] ?? "secondary"}>
                            {d.condFin}
                          </Badge>
                        </td>
                        <td className="py-2 text-xs">
                          {d.piorou ? (
                            <span className="font-medium text-red-700">
                              ⚠️ piorou
                            </span>
                          ) : (
                            <span className="text-green-700">melhorou</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          )}
        </Card>
      )}
    </div>
  );
}

function VistoriaCard({
  tipo,
  contratoId,
  vistoria,
}: {
  tipo: "INICIAL" | "FINAL";
  contratoId: string;
  vistoria:
    | {
        id: string;
        dataVistoria: Date;
        status: string;
        responsavelLocataria: string | null;
        itens: { id: string; area: string; condicao: string }[];
      }
    | undefined;
}) {
  const tipoLabel = tipo === "INICIAL" ? "Vistoria Inicial" : "Vistoria Final";
  const tipoDesc =
    tipo === "INICIAL"
      ? "No momento da entrega do galpão à locatária."
      : "No momento da devolução do galpão.";
  const href = `/contratos/${contratoId}/vistoria/${tipo.toLowerCase()}`;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ClipboardCheck className="h-5 w-5 text-primary" />
          {tipoLabel}
        </CardTitle>
        <CardDescription>{tipoDesc}</CardDescription>
      </CardHeader>
      <CardContent>
        {vistoria ? (
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Data</span>
              <span className="font-medium">
                {formatDate(vistoria.dataVistoria)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Status</span>
              <Badge variant={vistoria.status === "FINALIZADA" ? "success" : "warning"}>
                {vistoria.status}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Itens vistoriados</span>
              <span className="font-medium">{vistoria.itens.length}</span>
            </div>
            {vistoria.responsavelLocataria && (
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Resp. locatária</span>
                <span className="font-medium text-xs">
                  {vistoria.responsavelLocataria}
                </span>
              </div>
            )}
            <Button asChild className="w-full" variant="outline">
              <Link href={href}>Ver / editar laudo</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-3 py-2 text-center">
            <p className="text-sm text-slate-500">
              Ainda não cadastrada.
            </p>
            <Button asChild className="w-full">
              <Link href={href}>Cadastrar {tipoLabel.toLowerCase()}</Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
