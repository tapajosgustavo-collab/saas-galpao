import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/tenant";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExportButton } from "@/components/export-button";
import { formatBRL, formatDate } from "@/lib/utils";
import { Plus, AlertTriangle } from "lucide-react";

const statusColor: Record<string, "success" | "secondary" | "warning" | "destructive"> = {
  ATIVO: "success",
  ENCERRADO: "secondary",
  CANCELADO: "destructive",
  PENDENTE: "warning",
};

export default async function ContratosPage() {
  const ctx = await requireAuth();
  const contratos = await prisma.contrato.findMany({
    where: { tenantId: ctx.tenantId },
    orderBy: { createdAt: "desc" },
    include: { galpao: { select: { nome: true } } },
  });

  const hoje = new Date();
  const em60dias = new Date(hoje);
  em60dias.setDate(em60dias.getDate() + 60);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Contratos</h1>
          <p className="text-sm text-slate-500">{contratos.length} contrato(s)</p>
        </div>
        <div className="flex gap-2">
          {contratos.length > 0 && <ExportButton type="contratos" />}
          <Button asChild>
            <Link href="/contratos/novo">
              <Plus className="h-4 w-4" /> Novo contrato
            </Link>
          </Button>
        </div>
      </div>

      {contratos.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-slate-500">
            Nenhum contrato cadastrado.{" "}
            <Link href="/contratos/novo" className="text-primary hover:underline">
              Criar o primeiro
            </Link>
            .
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Lista de contratos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b text-left text-slate-500">
                  <tr>
                    <th className="pb-2 font-medium">Número</th>
                    <th className="pb-2 font-medium">Locatária</th>
                    <th className="pb-2 font-medium">Galpão</th>
                    <th className="pb-2 font-medium">Início</th>
                    <th className="pb-2 font-medium">Fim</th>
                    <th className="pb-2 font-medium">Valor mensal</th>
                    <th className="pb-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {contratos.map((c) => {
                    const vencendo =
                      c.status === "ATIVO" &&
                      c.dataFim <= em60dias &&
                      c.dataFim >= hoje;
                    return (
                      <tr
                        key={c.id}
                        className="cursor-pointer border-b transition-colors last:border-0 hover:bg-slate-50"
                      >
                        <td className="py-3 font-mono text-xs">
                          <Link
                            href={`/contratos/${c.id}`}
                            className="block w-full text-primary hover:underline"
                          >
                            {c.numero}
                          </Link>
                        </td>
                        <td className="py-3">
                          <Link href={`/contratos/${c.id}`} className="block w-full">
                            {c.empresaLocataria}
                          </Link>
                        </td>
                        <td className="py-3 text-slate-600">
                          <Link href={`/contratos/${c.id}`} className="block w-full">
                            {c.galpao.nome}
                          </Link>
                        </td>
                        <td className="py-3">
                          <Link href={`/contratos/${c.id}`} className="block w-full">
                            {formatDate(c.dataInicio)}
                          </Link>
                        </td>
                        <td className="py-3">
                          <Link href={`/contratos/${c.id}`} className="block w-full">
                            <span className="flex items-center gap-1">
                              {formatDate(c.dataFim)}
                              {vencendo && (
                                <AlertTriangle className="h-3 w-3 text-amber-500" />
                              )}
                            </span>
                          </Link>
                        </td>
                        <td className="py-3">
                          <Link href={`/contratos/${c.id}`} className="block w-full">
                            {formatBRL(Number(c.valorMensal))}
                          </Link>
                        </td>
                        <td className="py-3">
                          <Link href={`/contratos/${c.id}`} className="block w-full">
                            <Badge variant={statusColor[c.status] ?? "secondary"}>
                              {c.status}
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
