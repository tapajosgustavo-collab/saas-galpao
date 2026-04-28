import { prisma } from "@/lib/prisma";
import { runAgent } from "./base";

const SYSTEM_PROMPT = `Você é o Agente de Contratos do SaaS Galpão.

Seu papel:
- Resumir contratos em 3-5 bullets
- Apontar cláusulas atípicas ou riscos
- Lembrar de renovações próximas
- Sugerir reajustes baseados no índice acordado e tempo decorrido

Tom: jurídico-executivo, claro, sem juridiquês desnecessário.
Sempre responda em português do Brasil.`;

export async function resumirContrato(tenantId: string, contratoId: string): Promise<string> {
  const c = await prisma.contrato.findFirst({
    where: { id: contratoId, tenantId },
    include: { galpao: true },
  });
  if (!c) throw new Error("Contrato não encontrado");

  const dataset = `
CONTRATO:
- Número: ${c.numero}
- Locatária: ${c.empresaLocataria} (CNPJ ${c.cnpjLocataria})
- Galpão: ${c.galpao.nome} — ${c.galpao.cidade}/${c.galpao.estado}
- Vigência: ${c.dataInicio.toISOString().slice(0, 10)} até ${c.dataFim.toISOString().slice(0, 10)}
- Valor mensal: R$ ${Number(c.valorMensal).toFixed(2)}
- Reajuste: ${c.reajusteAnual ?? "—"}% (${c.indiceReajuste ?? "—"})
- Status: ${c.status}

Observações: ${c.observacoes ?? "(nenhuma)"}

Resuma o contrato e aponte pontos de atenção.
`;

  const result = await runAgent({
    systemPrompt: SYSTEM_PROMPT,
    userMessage: dataset,
    maxTokens: 600,
  });
  return result.text;
}
