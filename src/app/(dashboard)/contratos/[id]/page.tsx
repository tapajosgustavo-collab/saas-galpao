import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/tenant";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatBRL, formatDate } from "@/lib/utils";
import { ContratoEditForm } from "./form";

const statusVariant: Record<string, "success" | "warning" | "destructive" | "secondary" | "outline"> = {
  PAGO: "success",
  PARCIAL: "outline",
  PENDENTE: "warning",
  ATRASADO: "destructive",
  CANCELADO: "secondary",
};

export default async function ContratoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await requireAuth();
  const { id } = await params;

  const contrato = await prisma.contrato.findFirst({
    where: { id, tenantId: ctx.tenantId },
    include: {
      galpao: { select: { id: true, nome: true, cidade: true, estado: true } },
      receitas: {
        orderBy: { vencimento: "desc" },
        take: 12,
      },
    },
  });

  if (!contrato) notFound();

  // Galpoes elegiveis para reatribuir o contrato (incluindo o atual)
  const galpoes = await prisma.galpao.findMany({
    where: { tenantId: ctx.tenantId },
    select: { id: true, nome: true, cidade: true, estado: true },
    orderBy: { nome: "asc" },
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Contrato {contrato.numero}</h1>
        <p className="text-sm text-slate-500">
          {contrato.empresaLocataria} · CNPJ {contrato.cnpjLocataria}
        </p>
      </div>

      <ContratoEditForm
        contrato={{
          id: contrato.id,
          galpaoId: contrato.galpaoId,
          numero: contrato.numero,
          empresaLocataria: contrato.empresaLocataria,
          cnpjLocataria: contrato.cnpjLocataria,
          emailLocataria: contrato.emailLocataria ?? "",
          telefoneLocataria: contrato.telefoneLocataria ?? "",
          dataInicio: contrato.dataInicio.toISOString().slice(0, 10),
          dataFim: contrato.dataFim.toISOString().slice(0, 10),
          valorMensal: Number(contrato.valorMensal),
          diaVencimento: contrato.diaVencimento,
          reajusteAnual:
            contrato.reajusteAnual === null ? "" : String(contrato.reajusteAnual),
          indiceReajuste: contrato.indiceReajuste ?? "",
          status: contrato.status,
          observacoes: contrato.observacoes ?? "",
        }}
        galpoes={galpoes}
        canDelete={ctx.role === "ADMIN"}
      />

      {contrato.receitas.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Historico de cobrancas ({contrato.receitas.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              {contrato.receitas.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between border-b pb-2 last:border-0"
                >
                  <div>
                    <p className="font-medium">
                      Comp. {formatDate(r.competencia)}
                    </p>
                    <p className="text-xs text-slate-500">
                      Venc {formatDate(r.vencimento)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{formatBRL(Number(r.valor))}</span>
                    <Badge variant={statusVariant[r.status] ?? "secondary"}>
                      {r.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
