import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/tenant";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatBRL, formatDate } from "@/lib/utils";
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
    },
  });

  if (!galpao) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{galpao.nome}</h1>
        <p className="text-sm text-slate-500">
          {galpao.endereco} — {galpao.cidade}/{galpao.estado}
        </p>
      </div>

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
