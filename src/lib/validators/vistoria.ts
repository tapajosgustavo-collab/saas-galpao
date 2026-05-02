import { z } from "zod";
import {
  TipoVistoria,
  StatusVistoria,
  AreaVistoria,
  CondicaoItem,
} from "@prisma/client";

// Aceita string com URLs separadas por nova linha/virgula ou array.
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

export const itemVistoriaSchema = z.object({
  area: z.nativeEnum(AreaVistoria),
  descricao: z.string().max(500).optional().nullable(),
  condicao: z.nativeEnum(CondicaoItem),
  observacao: z.string().max(1000).optional().nullable(),
  fotos: fotosUrlListSchema.optional().default([]),
  ordem: z.coerce.number().int().min(0).default(0),
});

export const vistoriaCreateSchema = z.object({
  tipo: z.nativeEnum(TipoVistoria),
  dataVistoria: z.coerce.date(),
  responsavelInterno: z.string().max(200).optional().nullable(),
  responsavelLocataria: z.string().max(200).optional().nullable(),
  cpfLocataria: z.string().max(20).optional().nullable(),
  observacoesGerais: z.string().max(2000).optional().nullable(),
  fotosGerais: fotosUrlListSchema.optional().default([]),
  status: z.nativeEnum(StatusVistoria).default(StatusVistoria.RASCUNHO),
  documentoUrl: z.string().url().optional().nullable(),
  itens: z.array(itemVistoriaSchema).min(0).max(50).default([]),
});

export const vistoriaUpdateSchema = z.object({
  dataVistoria: z.coerce.date().optional(),
  responsavelInterno: z.string().max(200).nullable().optional(),
  responsavelLocataria: z.string().max(200).nullable().optional(),
  cpfLocataria: z.string().max(20).nullable().optional(),
  observacoesGerais: z.string().max(2000).nullable().optional(),
  fotosGerais: fotosUrlListSchema.optional(),
  status: z.nativeEnum(StatusVistoria).optional(),
  documentoUrl: z.string().url().nullable().optional(),
  itens: z.array(itemVistoriaSchema).max(50).optional(),
});

export type VistoriaCreateInput = z.infer<typeof vistoriaCreateSchema>;
export type ItemVistoriaInput = z.infer<typeof itemVistoriaSchema>;
