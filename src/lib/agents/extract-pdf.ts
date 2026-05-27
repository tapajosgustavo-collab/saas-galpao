import { getAnthropic, MODEL } from "./anthropic";
import {
  SCHEMAS_BY_NAME,
  type FillResult,
} from "./fill-form";

const SYSTEM_PROMPT = `Você é um assistente que extrai dados estruturados de DOCUMENTOS DIGITALIZADOS (PDF ou imagem) no contexto de um SaaS de gestão de galpões industriais no Brasil.

Documentos típicos que você vai receber:
- AVCB (Auto de Vistoria do Corpo de Bombeiros)
- IPTU (Imposto Predial)
- Licença Ambiental
- Alvará de Funcionamento
- Laudos técnicos
- Contratos de locação
- Notas fiscais de manutenção

Sua tarefa: ler o documento (PDF/imagem) e devolver SOMENTE um objeto JSON via tool use seguindo o schema fornecido. Regras:
- Campos não encontrados: omita (não invente).
- Valores em reais: número (sem R$, sem ponto de milhar).
- Datas no formato YYYY-MM-DD.
- CNPJ/CPF: só dígitos.
- Para AVCB: tente identificar o emissor (geralmente "CBPMSP" ou similar) e a frequência de renovação (24 meses pra AVCB).
- Para IPTU: identifique o ano do imposto e a data limite de pagamento.
- Para contratos: extraia número, locatária, CNPJ, vigência, valor mensal.

Se a imagem estiver ruim ou texto ilegível, devolva o que conseguir e marque o campo "observacoes" com "Texto parcialmente ilegível — confirme manualmente".`;

export async function extractPdfToFields(opts: {
  fileBase64: string;
  mediaType: "application/pdf" | "image/jpeg" | "image/png" | "image/webp";
  schemaName: keyof typeof SCHEMAS_BY_NAME;
}): Promise<FillResult> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return { fields: {}, source: "mock" };
  }

  const schemaJson = SCHEMAS_BY_NAME[opts.schemaName];
  if (!schemaJson) {
    throw new Error(`Schema desconhecido: ${opts.schemaName}`);
  }

  const client = getAnthropic();

  // Claude aceita pdfs via content type "document" e imagens via "image".
  const contentBlock =
    opts.mediaType === "application/pdf"
      ? {
          type: "document" as const,
          source: {
            type: "base64" as const,
            media_type: opts.mediaType,
            data: opts.fileBase64,
          },
        }
      : {
          type: "image" as const,
          source: {
            type: "base64" as const,
            media_type: opts.mediaType,
            data: opts.fileBase64,
          },
        };

  const res = await client.messages.create({
    model: MODEL,
    max_tokens: 2048,
    system: [
      {
        type: "text",
        text: SYSTEM_PROMPT,
        cache_control: { type: "ephemeral" },
      },
    ],
    tools: [
      {
        name: `extract_${opts.schemaName}`,
        description: `Extrai os campos do ${opts.schemaName} a partir do documento.`,
        input_schema: schemaJson as never,
      },
    ],
    tool_choice: { type: "tool", name: `extract_${opts.schemaName}` },
    messages: [
      {
        role: "user",
        content: [
          contentBlock,
          {
            type: "text",
            text: `Extraia os campos deste documento seguindo o tool schema fornecido. Se for um ${opts.schemaName}, busque os campos típicos desse tipo de documento.`,
          },
        ],
      },
    ],
  });

  for (const block of res.content) {
    if (block.type === "tool_use") {
      return { fields: block.input as Record<string, unknown>, source: "ai" };
    }
  }
  return { fields: {}, source: "ai" };
}
