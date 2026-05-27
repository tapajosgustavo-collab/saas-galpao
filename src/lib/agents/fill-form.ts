import { z } from "zod";
import { getAnthropic, MODEL } from "./anthropic";

const SYSTEM_PROMPT = `Você é um assistente que extrai dados estruturados de descrições em texto livre, no contexto de um SaaS de gestão de galpões industriais no Brasil.

Sua tarefa: ler o texto do usuário e devolver SOMENTE um objeto JSON válido seguindo o schema fornecido pela tool. NÃO inclua texto explicativo, código formatado, markdown — apenas o JSON via tool use.

Regras importantes:
- Se um campo não pode ser inferido com confiança, omita ou deixe null (não invente).
- Valores em reais: número (sem R$, sem ponto de milhar). Ex: "R$ 1.250,50" → 1250.50.
- Datas no formato YYYY-MM-DD.
- Metragens em m² como número.
- CNPJ: só dígitos (sem máscara).
- Texto livre em campos descricao/observacoes pode resumir o restante.

Se o texto estiver muito vago, use null/omit nos campos incertos — o usuário vai revisar antes de salvar.`;

export interface FillResult {
  fields: Record<string, unknown>;
  reasoning?: string;
  source: "ai" | "mock";
}

/**
 * Pede ao Claude pra extrair campos do texto livre seguindo um schema JSON.
 * Se ANTHROPIC_API_KEY nao configurada, devolve mock vazio (UI mantém form em branco).
 *
 * @param description Texto livre do usuario
 * @param schemaName Nome semantico ("galpao", "contrato", etc)
 * @param schemaJson JSON schema (subset) que Claude vai preencher
 */
export async function fillFormFromText(opts: {
  description: string;
  schemaName: string;
  schemaJson: Record<string, unknown>;
}): Promise<FillResult> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return { fields: {}, source: "mock" };
  }

  const client = getAnthropic();
  const res = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
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
        description: `Extrai os campos do ${opts.schemaName} a partir da descrição em texto livre.`,
        input_schema: opts.schemaJson as never,
      },
    ],
    tool_choice: { type: "tool", name: `extract_${opts.schemaName}` },
    messages: [
      {
        role: "user",
        content: `Texto livre do usuário:\n\n${opts.description}\n\nExtraia os campos seguindo o tool schema.`,
      },
    ],
  });

  // Extrai o tool_use do response
  for (const block of res.content) {
    if (block.type === "tool_use") {
      const input = block.input as Record<string, unknown>;
      return { fields: input, source: "ai" };
    }
  }
  return { fields: {}, source: "ai" };
}

// =========================================================
// Schemas JSON pra Claude preencher (subset dos forms)
// =========================================================

export const galpaoSchema = {
  type: "object",
  properties: {
    nome: { type: "string", description: "Nome curto do galpão. Ex: 'Galpão Anhanguera 01'" },
    endereco: { type: "string", description: "Endereço completo (rua, número)" },
    cidade: { type: "string", description: "Cidade" },
    estado: {
      type: "string",
      description: "UF de 2 letras maiúsculas",
      pattern: "^[A-Z]{2}$",
    },
    cep: { type: "string", description: "CEP só com dígitos, 8 caracteres" },
    metragemTotal: { type: "number", description: "Área total em m²" },
    metragemDisponivel: {
      type: "number",
      description: "Área disponível em m² (se não informado, assume igual à total)",
    },
    tipo: {
      type: "string",
      enum: ["LOGISTICO", "INDUSTRIAL", "ARMAZENAMENTO"],
      description: "Tipo do galpão",
    },
    valorPorM2: { type: "number", description: "Valor por m² em reais" },
    status: {
      type: "string",
      enum: ["DISPONIVEL", "OCUPADO", "EM_NEGOCIACAO", "MANUTENCAO"],
      description: "Status atual",
    },
    observacoes: { type: "string", description: "Notas livres" },
  },
} as const;

export const contratoSchema = {
  type: "object",
  properties: {
    numero: { type: "string", description: "Número do contrato (ex: CT-2024-001)" },
    empresaLocataria: { type: "string", description: "Nome da empresa locatária" },
    cnpjLocataria: {
      type: "string",
      description: "CNPJ da locatária, só dígitos (14 chars)",
    },
    emailLocataria: { type: "string", description: "Email de contato (opcional)" },
    telefoneLocataria: { type: "string", description: "Telefone (opcional)" },
    dataInicio: { type: "string", description: "Data início YYYY-MM-DD" },
    dataFim: { type: "string", description: "Data fim YYYY-MM-DD" },
    valorMensal: { type: "number", description: "Valor mensal em reais" },
    diaVencimento: { type: "number", description: "Dia do mês p/ vencimento (1-28)" },
    reajusteAnual: { type: "number", description: "% reajuste anual (ex: 5)" },
    indiceReajuste: { type: "string", description: "Índice (IPCA, IGPM, etc)" },
    status: {
      type: "string",
      enum: ["ATIVO", "ENCERRADO", "CANCELADO", "PENDENTE"],
    },
    observacoes: { type: "string" },
  },
} as const;

export const manutencaoSchema = {
  type: "object",
  properties: {
    tipo: {
      type: "string",
      enum: ["PREVENTIVA", "CORRETIVA", "EMERGENCIAL"],
    },
    categoria: {
      type: "string",
      enum: [
        "ELETRICA",
        "HIDRAULICA",
        "ESTRUTURAL",
        "COBERTURA",
        "PINTURA",
        "PORTAS_PORTOES",
        "PISO",
        "CLIMATIZACAO",
        "SEGURANCA",
        "LIMPEZA",
        "OUTROS",
      ],
    },
    descricao: { type: "string", description: "O que foi feito" },
    prestador: { type: "string", description: "Nome empresa/pessoa" },
    prestadorContato: { type: "string", description: "Telefone/email" },
    prestadorCnpj: { type: "string", description: "CNPJ/CPF (só dígitos)" },
    dataInicio: { type: "string", description: "YYYY-MM-DD" },
    dataFim: { type: "string", description: "YYYY-MM-DD (se concluída)" },
    valor: { type: "number", description: "Valor em reais" },
    pagoPor: {
      type: "string",
      enum: ["LOCADOR", "LOCATARIA", "COMPARTILHADO"],
    },
    status: {
      type: "string",
      enum: ["AGENDADA", "EM_ANDAMENTO", "CONCLUIDA", "CANCELADA"],
    },
    observacoes: { type: "string" },
  },
} as const;

export const documentoSchema = {
  type: "object",
  properties: {
    tipo: {
      type: "string",
      enum: [
        "AVCB",
        "LICENCA_AMBIENTAL",
        "ALVARA_FUNCIONAMENTO",
        "IPTU",
        "LAUDO_TECNICO",
        "ANALISE_POTABILIDADE",
        "PGRS",
        "OUTROS",
      ],
    },
    nome: { type: "string", description: "Descrição curta (ex: 'AVCB 2024-2026')" },
    numero: { type: "string", description: "Protocolo/número" },
    emissor: { type: "string", description: "Órgão emissor (ex: CBPMSP)" },
    dataEmissao: { type: "string", description: "YYYY-MM-DD" },
    dataValidade: { type: "string", description: "YYYY-MM-DD" },
    frequenciaRenovacaoMeses: {
      type: "number",
      description: "Meses entre renovações (24 pra AVCB, 12 pra IPTU, 3 pra trimestral)",
    },
    alertarDiasAntes: {
      type: "number",
      description: "Quantos dias antes do vencimento avisar (default 60)",
    },
    responsavelPagamento: {
      type: "string",
      enum: ["LOCADOR", "LOCATARIA", "COMPARTILHADO"],
      description: "Apenas pra IPTU — quem paga",
    },
    observacoes: { type: "string" },
  },
} as const;

export const vistoriaItensSchema = {
  type: "object",
  description:
    "Checklist de áreas com condição BOM/REGULAR/RUIM/CRITICO + observações curtas. Use a descrição livre pra preencher áreas que o usuário mencionou.",
  properties: {
    observacoesGerais: { type: "string", description: "Comentário global sobre o estado do galpão" },
    itens: {
      type: "array",
      description: "Lista de áreas avaliadas",
      items: {
        type: "object",
        properties: {
          area: {
            type: "string",
            enum: [
              "ESTRUTURA",
              "COBERTURA",
              "PISO",
              "PAREDES",
              "PORTAS_PORTOES",
              "ELETRICA",
              "HIDRAULICA",
              "ILUMINACAO",
              "CLIMATIZACAO",
              "SEGURANCA",
              "PINTURA",
              "ACESSO",
              "ESTACIONAMENTO",
              "DOCAS",
              "OUTROS",
            ],
          },
          condicao: {
            type: "string",
            enum: ["BOM", "REGULAR", "RUIM", "CRITICO"],
          },
          observacao: { type: "string" },
        },
        required: ["area", "condicao"],
      },
    },
  },
} as const;

// Mapa pra route generica resolver schema por nome
export const SCHEMAS_BY_NAME: Record<string, Record<string, unknown>> = {
  galpao: galpaoSchema,
  contrato: contratoSchema,
  manutencao: manutencaoSchema,
  documento: documentoSchema,
  vistoria: vistoriaItensSchema,
};

export const inputSchemaValidator = z.object({
  schemaName: z.enum(["galpao", "contrato", "manutencao", "documento", "vistoria"]),
  description: z.string().min(3).max(5000),
});
