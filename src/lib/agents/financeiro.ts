import { prisma } from "@/lib/prisma";
import { runAgent } from "./base";

const SYSTEM_PROMPT = `Você é o Agente Financeiro do SaaS Galpão.

Seu papel:
- Analisar fluxo de caixa (receitas vs despesas) do tenant
- Detectar inadimplência e padrões de atraso
- Sugerir ajustes de aluguel quando o galpão está abaixo da média do mercado
- Apontar riscos financeiros de forma direta

Tom: objetivo, executivo, números primeiro. Use bullets curtos.
Sempre responda em português do Brasil.`;

export async function analisarFinanceiro(tenantId: string): Promise<string> {
  const inicioMes = new Date();
  inicioMes.setDate(1);
  inicioMes.setHours(0, 0, 0, 0);

  const tresMesesAtras = new Date(inicioMes);
  tresMesesAtras.setMonth(tresMesesAtras.getMonth() - 3);

  const [receitas, despesas, atrasadas, contratosAtivos] = await Promise.all([
    prisma.receita.aggregate({
      where: { tenantId, competencia: { gte: tresMesesAtras } },
      _sum: { valor: true },
      _count: true,
    }),
    prisma.despesa.aggregate({
      where: { tenantId, competencia: { gte: tresMesesAtras } },
      _sum: { valor: true },
      _count: true,
    }),
    prisma.receita.count({
      where: {
        tenantId,
        status: "PENDENTE",
        vencimento: { lt: new Date() },
      },
    }),
    prisma.contrato.count({ where: { tenantId, status: "ATIVO" } }),
  ]);

  const dataset = `
DADOS DO TENANT (últimos 3 meses):
- Receita total: R$ ${Number(receitas._sum.valor ?? 0).toFixed(2)} (${receitas._count} cobranças)
- Despesa total: R$ ${Number(despesas._sum.valor ?? 0).toFixed(2)} (${despesas._count} lançamentos)
- Cobranças em atraso (agora): ${atrasadas}
- Contratos ativos: ${contratosAtivos}

Analise e devolva 3 a 5 insights acionáveis.
`;

  const result = await runAgent({
    systemPrompt: SYSTEM_PROMPT,
    userMessage: dataset,
    maxTokens: 800,
  });
  return result.text;
}
