import { z } from "zod";
import { TipoGalpao, StatusGalpao } from "@prisma/client";

export const galpaoCreateSchema = z
  .object({
    nome: z.string().min(2).max(120),
    endereco: z.string().min(3).max(200),
    cidade: z.string().min(2).max(100),
    estado: z.string().length(2).toUpperCase(),
    cep: z
      .string()
      .regex(/^\d{5}-?\d{3}$/, "CEP inválido")
      .transform((v) => v.replace(/\D/g, "")),
    metragemTotal: z.coerce.number().positive().max(10_000_000),
    metragemDisponivel: z.coerce.number().nonnegative().max(10_000_000),
    tipo: z.nativeEnum(TipoGalpao),
    valorPorM2: z.coerce.number().nonnegative().max(100_000),
    status: z.nativeEnum(StatusGalpao).default(StatusGalpao.DISPONIVEL),
    observacoes: z.string().max(2000).optional().nullable(),
  })
  .refine((d) => d.metragemDisponivel <= d.metragemTotal, {
    message: "Metragem disponível não pode ser maior que a total",
    path: ["metragemDisponivel"],
  });

export const galpaoUpdateSchema = galpaoCreateSchema.partial();

export type GalpaoCreateInput = z.infer<typeof galpaoCreateSchema>;
export type GalpaoUpdateInput = z.infer<typeof galpaoUpdateSchema>;
