import { z } from "zod";
import { StatusContrato } from "@prisma/client";

export const contratoCreateSchema = z
  .object({
    galpaoId: z.string().cuid(),
    numero: z.string().min(1).max(50),
    empresaLocataria: z.string().min(2).max(200),
    cnpjLocataria: z
      .string()
      .regex(/^\d{14}$|^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/, "CNPJ inválido")
      .transform((v) => v.replace(/\D/g, "")),
    emailLocataria: z.string().email().max(200).optional().nullable(),
    telefoneLocataria: z.string().max(30).optional().nullable(),
    dataInicio: z.coerce.date(),
    dataFim: z.coerce.date(),
    valorMensal: z.coerce.number().positive().max(100_000_000),
    diaVencimento: z.coerce.number().int().min(1).max(28).default(5),
    reajusteAnual: z.coerce.number().min(0).max(100).optional().nullable(),
    indiceReajuste: z.string().max(20).optional().nullable(),
    status: z.nativeEnum(StatusContrato).default(StatusContrato.ATIVO),
    documentoUrl: z.string().url().optional().nullable(),
    observacoes: z.string().max(2000).optional().nullable(),
  })
  .refine((d) => d.dataFim > d.dataInicio, {
    message: "Data fim deve ser posterior à data início",
    path: ["dataFim"],
  });

export const contratoUpdateSchema = contratoCreateSchema.partial();

export type ContratoCreateInput = z.infer<typeof contratoCreateSchema>;
