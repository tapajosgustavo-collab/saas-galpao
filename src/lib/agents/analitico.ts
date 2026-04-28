import { prisma } from "@/lib/prisma";
import { runAgent } from "./base";

const SYSTEM_PROMPT = `Você é o Agente Analítico do SaaS Galpão.

Seu papel:
- Gerar insights de alto nível cruzando dados de galpões, contratos e financeiro
- Apontar oportunidades: "galpão abaixo do preço da praça", "queda de ocupação", "concentração de risco em uma locatária"
- Recomendar 2-3 ações priorizadas

Tom: estratégico, gerencial. Comece com a conclusão (TL;DR), depois detalhe.
Sempre responda em português do Brasil.`;

export async function gerarInsights(tenantId: string): Promise<string> {
  const [galpoes, contratos, receitasMes] = await Promise.all([
    prisma.galpao.findMany({
      where: { tenantId },
      select: {
        id: true,
        nome: true,
        status: true,
        valorPorM2: true,
        metragemTotal: true,
        cidade: true,
      },
    }),
    prisma.contrato.findMany({
      where: { tenantId, status: "ATIVO" },
      select: { empresaLocataria: true, valorMensal: true, dataFim: true },
    }),
    prisma.receita.aggregate({
      where: {
        tenantId,
        competencia: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      },
      _sum: { valor: true },
    }),
  ]);

  const totalAtivos = galpoes.filter((g) => g.status === "OCUPADO").length;
  const totalGalpoes = galpoes.length;
  const valoresM2 = galpoes.map((g) => Number(g.valorPorM2));
  const mediaM2 =
    valoresM2.length === 0
      ? 0
      : valoresM2.reduce((a, b) => a + b, 0) / valoresM2.length;

  const dataset = `
SNAPSHOT DO TENANT:
- Galpões: ${totalGalpoes} (${totalAtivos} ocupados)
- Valor médio R$/m²: ${mediaM2.toFixed(2)}
- Contratos ativos: ${contratos.length}
- Receita do mês corrente: R$ ${Number(receitasMes._sum.valor ?? 0).toFixed(2)}

Top 5 contratos por valor:
${contratos
  .sort((a, b) => Number(b.valorMensal) - Number(a.valorMensal))
  .slice(0, 5)
  .map(
    (c) =>
      `- ${c.empresaLocataria}: R$ ${Number(c.valorMensal).toFixed(2)}/mês (até ${c.dataFim.toISOString().slice(0, 10)})`,
  )
  .join("\n")}

Gere TL;DR + 3 insights priorizados.
`;

  const result = await runAgent({
    systemPrompt: SYSTEM_PROMPT,
    userMessage: dataset,
    maxTokens: 1000,
  });
  return result.text;
}
