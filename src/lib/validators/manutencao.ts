import { z } from "zod";
import {
  TipoManutencao,
  CategoriaManutencao,
  StatusManutencao,
  ResponsavelPagamento,
} from "@prisma/client";

// Aceita string com URLs separadas por nova linha ou virgula, ou
// array. Retorna array de URLs validas.
const fotosUrlListSchema = z
  .union([z.string(), z.array(z.string())])
  .transform((v) => {
    if (Array.isArray(v)) return v;
    return v
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  })
  .pipe(z.array(z.string().url()).max(20));

export const manutencaoCreateSchema = z
  .object({
    contratoId: z.string().cuid().optional().nullable(),
    tipo: z.nativeEnum(TipoManutencao),
    categoria: z.nativeEnum(CategoriaManutencao),
    descricao: z.string().min(2).max(2000),
    prestador: z.string().min(2).max(200),
    prestadorContato: z.string().max(100).optional().nullable(),
    prestadorCnpj: z.string().max(30).optional().nullable(),
    dataInicio: z.coerce.date(),
    dataFim: z.coerce.date().optional().nullable(),
    valor: z.coerce.number().positive().max(100_000_000),
    pagoPor: z.nativeEnum(ResponsavelPagamento).optional().nullable(),
    status: z.nativeEnum(StatusManutencao).default(StatusManutencao.AGENDADA),
    fotosAntes: fotosUrlListSchema.optional().default([]),
    fotosDepois: fotosUrlListSchema.optional().default([]),
    notaFiscalUrl: z.string().url().optional().nullable(),
    observacoes: z.string().max(2000).optional().nullable(),
  })
  .refine((d) => !d.dataFim || d.dataFim >= d.dataInicio, {
    message: "Data fim deve ser igual ou posterior a data inicio",
    path: ["dataFim"],
  });

export const manutencaoUpdateSchema = z.object({
  contratoId: z.string().cuid().nullable().optional(),
  tipo: z.nativeEnum(TipoManutencao).optional(),
  categoria: z.nativeEnum(CategoriaManutencao).optional(),
  descricao: z.string().min(2).max(2000).optional(),
  prestador: z.string().min(2).max(200).optional(),
  prestadorContato: z.string().max(100).nullable().optional(),
  prestadorCnpj: z.string().max(30).nullable().optional(),
  dataInicio: z.coerce.date().optional(),
  dataFim: z.coerce.date().nullable().optional(),
  valor: z.coerce.number().positive().optional(),
  pagoPor: z.nativeEnum(ResponsavelPagamento).nullable().optional(),
  status: z.nativeEnum(StatusManutencao).optional(),
  fotosAntes: fotosUrlListSchema.optional(),
  fotosDepois: fotosUrlListSchema.optional(),
  notaFiscalUrl: z.string().url().nullable().optional(),
  observacoes: z.string().max(2000).nullable().optional(),
});
