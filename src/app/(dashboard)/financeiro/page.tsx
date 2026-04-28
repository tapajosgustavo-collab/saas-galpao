import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/tenant";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatBRL, formatDate } from "@/lib/utils";
import { TrendingUp, TrendingDown, AlertCircle } from "lucide-react";

const statusVariant: Record<string, "success" | "warning" | "destructive" | "secondary"> = {
  PAGO: "success",
  PENDENTE: "warning",
  ATRASADO: "destructive",
  CANCELADO: "secondary",
};

export default async function FinanceiroPage() {
  const ctx = await requireAuth();

  const inicioMes = new Date();
  inicioMes.setDate(1);
  inicioMes.setHours(0, 0, 0, 0);

  const fimMes = new Date(inicioMes);
  fimMes.setMonth(fimMes.getMonth() + 1);

  const [receitasMes, despesasMes, receitas, despesas, atrasadas] = await Promise.all([
    prisma.receita.aggregate({
      where: {
        tenantId: ctx.tenantId,
        competencia: { gte: inicioMes, lt: fimMes },
        status: { in: ["PAGO", "PENDENTE"] },
      },
      _sum: { valor: true },
    }),
    prisma.despesa.aggregate({
      where: {
        tenantId: ctx.tenantId,
        competencia: { gte: inicioMes, lt: fimMes },
      },
      _sum: { valor: true },
    }),
    prisma.receita.findMany({
      where: { tenantId: ctx.tenantId },
      orderBy: { vencimento: "desc" },
      take: 20,
      include: {
        contrato: { select: { numero: true, empresaLocataria: true } },
      },
    }),
    prisma.despesa.findMany({
      where: { tenantId: ctx.tenantId },
      orderBy: { vencimento: "desc" },
      take: 20,
    }),
    prisma.receita.count({
      where: {
        tenantId: ctx.tenantId,
        status: "PENDENTE",
        vencimento: { lt: new Date() },
      },
    }),
  ]);

  const receita = Number(receitasMes._sum.valor ?? 0);
  const despesa = Number(despesasMes._sum.valor ?? 0);
  const lucro = receita - despesa;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Financeiro</h1>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Receita do mês</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">{formatBRL(receita)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Despesas do mês</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-700">{formatBRL(despesa)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Lucro do mês</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatBRL(lucro)}</div>
          </CardContent>
        </Card>
      </div>

      {atrasadas > 0 && (
        <Card className="border-amber-300 bg-amber-50">
          <CardContent className="flex items-center gap-3 py-4">
            <AlertCircle className="h-5 w-5 text-amber-600" />
            <p className="text-sm">
              <strong>{atrasadas}</strong> cobrança(s) em atraso. Verifique a lista de receitas.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Receitas recentes</CardTitle>
          </CardHeader>
          <CardContent>
            {receitas.length === 0 ? (
              <p className="text-sm text-slate-500">Nenhuma receita registrada.</p>
            ) : (
              <div className="space-y-2">
                {receitas.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between border-b pb-2 last:border-0"
                  >
                    <div>
                      <p className="text-sm font-medium">{r.contrato.empresaLocataria}</p>
                      <p className="text-xs text-slate-500">
                        {r.contrato.numero} · venc {formatDate(r.vencimento)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {formatBRL(Number(r.valor))}
                      </span>
                      <Badge variant={statusVariant[r.status] ?? "secondary"}>
                        {r.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Despesas recentes</CardTitle>
          </CardHeader>
          <CardContent>
            {despesas.length === 0 ? (
              <p className="text-sm text-slate-500">Nenhuma despesa registrada.</p>
            ) : (
              <div className="space-y-2">
                {despesas.map((d) => (
                  <div
                    key={d.id}
                    className="flex items-center justify-between border-b pb-2 last:border-0"
                  >
                    <div>
                      <p className="text-sm font-medium">{d.descricao}</p>
                      <p className="text-xs text-slate-500">
                        {d.categoria} · venc {formatDate(d.vencimento)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-red-700">
                        {formatBRL(Number(d.valor))}
                      </span>
                      <Badge variant={d.pago ? "success" : "warning"}>
                        {d.pago ? "PAGO" : "ABERTO"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
