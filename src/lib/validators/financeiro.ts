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

export const receitaUpdateSchema = z.object({
  contratoId: z.string().cuid().optional(),
  competencia: z.coerce.date().optional(),
  vencimento: z.coerce.date().optional(),
  valor: z.coerce.number().positive().optional(),
  valorPago: z.coerce.number().positive().nullable().optional(),
  dataPagamento: z.coerce.date().nullable().optional(),
  status: z.nativeEnum(StatusPagamento).optional(),
  observacoes: z.string().max(1000).nullable().optional(),
});

export const despesaCreateSchema = z.object({
  galpaoId: z.string().cuid().optional().nullable(),
  descricao: z.string().min(2).max(200),
  categoria: z.nativeEnum(CategoriaDespesa),
  competencia: z.coerce.date(),
  vencimento: z.coerce.date(),
  valor: z.coerce.number().positive(),
  pago: z.coerce.boolean().default(false),
  observacoes: z.string().max(1000).optional().nullable(),
});

export const despesaUpdateSchema = z.object({
  galpaoId: z.string().cuid().nullable().optional(),
  descricao: z.string().min(2).max(200).optional(),
  categoria: z.nativeEnum(CategoriaDespesa).optional(),
  competencia: z.coerce.date().optional(),
  vencimento: z.coerce.date().optional(),
  valor: z.coerce.number().positive().optional(),
  pago: z.coerce.boolean().optional(),
  dataPagamento: z.coerce.date().nullable().optional(),
  observacoes: z.string().max(1000).nullable().optional(),
});

export const registroSchema = z.object({
  empresa: z.string().min(2).max(120),
  nome: z.string().min(2).max(120),
  email: z.string().email().max(200),
  password: z.string().min(8).max(200),
});
