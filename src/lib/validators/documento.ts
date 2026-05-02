import { z } from "zod";
import {
  TipoDocumentoGalpao,
  StatusDocumento,
  ResponsavelPagamento,
} from "@prisma/client";

export const documentoCreateSchema = z.object({
  tipo: z.nativeEnum(TipoDocumentoGalpao),
  nome: z.string().min(2).max(200),
  numero: z.string().max(100).optional().nullable(),
  emissor: z.string().max(200).optional().nullable(),
  dataEmissao: z.coerce.date().optional().nullable(),
  dataValidade: z.coerce.date(),
  frequenciaRenovacaoMeses: z.coerce.number().int().min(1).max(120).optional().nullable(),
  alertarDiasAntes: z.coerce.number().int().min(1).max(365).default(60),
  status: z.nativeEnum(StatusDocumento).default(StatusDocumento.VIGENTE),
  responsavelPagamento: z.nativeEnum(ResponsavelPagamento).optional().nullable(),
  documentoUrl: z.string().url().optional().nullable(),
  observacoes: z.string().max(2000).optional().nullable(),
});

export const documentoUpdateSchema = documentoCreateSchema.partial();

export type DocumentoCreateInput = z.infer<typeof documentoCreateSchema>;
