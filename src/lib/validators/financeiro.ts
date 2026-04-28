import { z } from "zod";
import { CategoriaDespesa, StatusPagamento } from "@prisma/client";

export const receitaCreateSchema = z.object({
  contratoId: z.string().cuid(),
  competencia: z.coerce.date(),
  vencimento: z.coerce.date(),
  valor: z.coerce.number().positive(),
  status: z.nativeEnum(StatusPagamento).default(StatusPagamento.PENDENTE),
  observacoes: z.string().max(1000).optional().nullable(),
});

export const receitaPagarSchema = z.object({
  valorPago: z.coerce.number().positive(),
  dataPagamento: z.coerce.date(),
});

export const despesaCreateSchema = z.object({
  galpaoId: z.string().cuid().optional().nullable(),
  descricao: z.string().min(2).max(200),
  categoria: z.nativeEnum(CategoriaDespesa),
  competencia: z.coerce.date(),
  vencimento: z.coerce.date(),
  valor: z.coerce.number().positive(),
  pago: z.boolean().default(false),
  observacoes: z.string().max(1000).optional().nullable(),
});

export const registroSchema = z.object({
  empresa: z.string().min(2).max(120),
  nome: z.string().min(2).max(120),
  email: z.string().email().max(200),
  password: z.string().min(8).max(200),
});
