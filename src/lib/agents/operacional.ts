import { prisma } from "@/lib/prisma";
import { runAgent } from "./base";

const SYSTEM_PROMPT = `Você é o Agente Operacional do SaaS Galpão.

Seu papel:
- Analisar ocupação dos galpões
- Detectar ociosidade (galpão disponível há muito tempo)
- Sugerir ações: reduzir preço, marketing, manutenção
- Cruzar dados de m² disponível vs ocupado

Tom: operacional, prático. Sempre 3-5 bullets.
Sempre responda em português do Brasil.`;

export async function analisarOperacao(tenantId: string): Promise<string> {
  const galpoes = await prisma.galpao.findMany({
    where: { tenantId },
    include: { contratos: { where: { status: "ATIVO" }, select: { id: true } } },
  });

  const linhas = galpoes
    .map(
      (g) =>
        `- ${g.nome} (${g.cidade}/${g.estado}): ${g.status}, ${g.tipo}, ${Number(g.metragemDisponivel)}/${Number(g.metragemTotal)} m² disp, R$/m² ${Number(g.valorPorM2).toFixed(2)}, ${g.contratos.length} contrato(s) ativos`,
    )
    .join("\n");

  const dataset = `
PORTFÓLIO DE GALPÕES (${galpoes.length} unidades):
${linhas || "(nenhum galpão cadastrado)"}

Analise ocupação e aponte galpões ociosos ou subutilizados.
`;

  const result = await runAgent({
    systemPrompt: SYSTEM_PROMPT,
    userMessage: dataset,
    maxTokens: 700,
  });
  return result.text;
}
