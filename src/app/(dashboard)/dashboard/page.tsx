import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/tenant";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatBRL, formatDate, formatPercent } from "@/lib/utils";
import { Building2, FileText, TrendingUp, AlertTriangle } from "lucide-react";
import { AutomationPanel } from "./automation-panel";

export default async function DashboardPage() {
  const ctx = await requireAuth();
  const tenantId = ctx.tenantId;

  const inicioMes = new Date();
  inicioMes.setDate(1);
  inicioMes.setHours(0, 0, 0, 0);

  const fimMes = new Date(inicioMes);
  fimMes.setMonth(fimMes.getMonth() + 1);

  const em60dias = new Date();
  em60dias.setDate(em60dias.getDate() + 60);

  const [galpoes, contratosAtivos, receitaMes, contratosVencendo, atrasadas] =
    await Promise.all([
      prisma.galpao.findMany({
        where: { tenantId },
        select: {
          status: true,
          metragemTotal: true,
          metragemDisponivel: true,
        },
      }),
      prisma.contrato.count({ where: { tenantId, status: "ATIVO" } }),
      prisma.receita.aggregate({
        where: {
          tenantId,
          competencia: { gte: inicioMes, lt: fimMes },
          status: { in: ["PAGO", "PENDENTE"] },
        },
        _sum: { valor: true },
      }),
      prisma.contrato.findMany({
        where: {
          tenantId,
          status: "ATIVO",
          dataFim: { lte: em60dias, gte: new Date() },
        },
        orderBy: { dataFim: "asc" },
        take: 5,
        include: { galpao: { select: { nome: true } } },
      }),
      prisma.receita.findMany({
        where: {
          tenantId,
          status: "PENDENTE",
          vencimento: { lt: new Date() },
        },
        orderBy: { vencimento: "asc" },
        take: 5,
        include: { contrato: { select: { empresaLocataria: true } } },
      }),
    ]);

  const total = galpoes.length;
  const ocupados = galpoes.filter((g) => g.status === "OCUPADO").length;
  const taxaOcupacao = total === 0 ? 0 : (ocupados / total) * 100;

  const m2Total = galpoes.reduce((acc, g) => acc + Number(g.metragemTotal), 0);
  const m2Disp = galpoes.reduce((acc, g) => acc + Number(g.metragemDisponivel), 0);
  const ocupacaoArea = m2Total === 0 ? 0 : ((m2Total - m2Disp) / m2Total) * 100;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-sm text-slate-500">Visão geral da operação</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <KpiCard
          title="Galpões"
          value={`${ocupados}/${total}`}
          subtitle={`${formatPercent(taxaOcupacao)} ocupação`}
          icon={<Building2 className="h-4 w-4 text-primary" />}
        />
        <KpiCard
          title="Contratos ativos"
          value={String(contratosAtivos)}
          subtitle="em vigência"
          icon={<FileText className="h-4 w-4 text-primary" />}
        />
        <KpiCard
          title="Receita do mês"
          value={formatBRL(Number(receitaMes._sum.valor ?? 0))}
          subtitle="competência atual"
          icon={<TrendingUp className="h-4 w-4 text-green-600" />}
        />
        <KpiCard
          title="Ocupação por m²"
          value={formatPercent(ocupacaoArea)}
          subtitle={`${(m2Total - m2Disp).toLocaleString("pt-BR")} m² ocupados`}
          icon={<Building2 className="h-4 w-4 text-primary" />}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Contratos vencendo (60 dias)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {contratosVencendo.length === 0 ? (
              <p className="text-sm text-slate-500">Nenhum contrato vencendo.</p>
            ) : (
              <ul className="space-y-2">
                {contratosVencendo.map((c) => (
                  <li
                    key={c.id}
                    className="flex items-center justify-between border-b pb-2 last:border-0"
                  >
                    <div>
                      <p className="text-sm font-medium">{c.empresaLocataria}</p>
                      <p className="text-xs text-slate-500">
                        {c.galpao.nome} · {c.numero}
                      </p>
                    </div>
                    <Badge variant="warning">{formatDate(c.dataFim)}</Badge>
                  </li>
                ))}
              </ul>
            )}
            <Link
              href="/contratos"
              className="mt-3 inline-block text-xs text-primary hover:underline"
            >
              Ver todos →
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Pagamentos em atraso
            </CardTitle>
          </CardHeader>
          <CardContent>
            {atrasadas.length === 0 ? (
              <p className="text-sm text-slate-500">Nenhum pagamento em atraso.</p>
            ) : (
              <ul className="space-y-2">
                {atrasadas.map((r) => (
                  <li
                    key={r.id}
                    className="flex items-center justify-between border-b pb-2 last:border-0"
                  >
                    <div>
                      <p className="text-sm font-medium">{r.contrato.empresaLocataria}</p>
                      <p className="text-xs text-slate-500">
                        Vencido em {formatDate(r.vencimento)}
                      </p>
                    </div>
                    <span className="text-sm font-medium text-red-700">
                      {formatBRL(Number(r.valor))}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <Link
              href="/financeiro"
              className="mt-3 inline-block text-xs text-primary hover:underline"
            >
              Ver financeiro →
            </Link>
          </CardContent>
        </Card>
      </div>

      {(ctx.role === "ADMIN" || ctx.role === "GESTOR") && <AutomationPanel />}
    </div>
  );
}

function KpiCard({
  title,
  value,
  subtitle,
  icon,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-slate-500">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-slate-500">{subtitle}</p>
      </CardContent>
    </Card>
  );
}
