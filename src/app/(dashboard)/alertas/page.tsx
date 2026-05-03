import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/tenant";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertasClient } from "./alertas-client";
import { Bell } from "lucide-react";

const TIPO_LABEL: Record<string, string> = {
  CONTRATO_VENCENDO: "Contratos vencendo",
  PAGAMENTO_ATRASADO: "Pagamentos atrasados",
  GALPAO_OCIOSO: "Galpões ociosos",
  REAJUSTE_PENDENTE: "Reajustes pendentes",
  DOCUMENTO_VENCENDO: "Documentos vencendo",
  IPTU_PENDENTE: "IPTU pendente",
  INSIGHT_AI: "Insight IA",
};

export default async function AlertasPage() {
  const ctx = await requireAuth();

  const [alertas, totalNaoLidos] = await Promise.all([
    prisma.alerta.findMany({
      where: { tenantId: ctx.tenantId },
      orderBy: [
        { lido: "asc" },
        { severidade: "desc" }, // CRITICAL > WARNING > INFO
        { createdAt: "desc" },
      ],
      take: 200,
    }),
    prisma.alerta.count({
      where: { tenantId: ctx.tenantId, lido: false },
    }),
  ]);

  // Agrupa por tipo (so nao-lidos pra mostrar volume)
  const naoLidos = alertas.filter((a) => a.lido === false);
  const lidosRecentes = alertas.filter((a) => a.lido === true).slice(0, 30);

  const porTipo = naoLidos.reduce<Record<string, number>>((acc, a) => {
    acc[a.tipo] = (acc[a.tipo] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold">
            <Bell className="h-7 w-7 text-primary" />
            Alertas
          </h1>
          <p className="text-sm text-slate-500">
            Tudo que precisa de atenção, gerado automaticamente pelo cron diário.
          </p>
        </div>
        {totalNaoLidos > 0 && (
          <Badge variant="warning" className="text-base">
            {totalNaoLidos} não lido{totalNaoLidos === 1 ? "" : "s"}
          </Badge>
        )}
      </div>

      {/* Resumo por tipo */}
      {Object.keys(porTipo).length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {Object.entries(porTipo).map(([tipo, count]) => (
            <Card key={tipo}>
              <CardHeader className="pb-2">
                <CardDescription className="text-xs">
                  {TIPO_LABEL[tipo] ?? tipo}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{count}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AlertasClient
        naoLidos={naoLidos.map((a) => ({
          id: a.id,
          tipo: a.tipo,
          severidade: a.severidade,
          titulo: a.titulo,
          mensagem: a.mensagem,
          refType: a.refType,
          refId: a.refId,
          createdAt: a.createdAt.toISOString(),
        }))}
        lidosRecentes={lidosRecentes.map((a) => ({
          id: a.id,
          tipo: a.tipo,
          severidade: a.severidade,
          titulo: a.titulo,
          mensagem: a.mensagem,
          refType: a.refType,
          refId: a.refId,
          createdAt: a.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
