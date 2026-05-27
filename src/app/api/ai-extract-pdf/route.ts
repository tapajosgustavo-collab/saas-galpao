import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/tenant";
import { apiError } from "@/lib/api";
import { requireAIAssist } from "@/lib/plan-limits";
import { extractPdfToFields } from "@/lib/agents/extract-pdf";

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_MIMES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const schemaNameValidator = z.enum([
  "galpao",
  "contrato",
  "manutencao",
  "documento",
  "vistoria",
]);

/**
 * POST /api/ai-extract-pdf — multipart/form-data
 *   field: file (PDF ou imagem)
 *   field: schemaName ('documento' | 'contrato' | 'manutencao' | ...)
 *
 * Manda o arquivo pro Claude (vision/document) extrair campos estruturados
 * seguindo o schema. Util pra AVCB, IPTU, contratos digitalizados.
 *
 * Gateado por plano Pro+ via requireAIAssist.
 */
export async function POST(req: Request) {
  try {
    const ctx = await requireAuth();
    await requireAIAssist(ctx.tenantId);

    const fd = await req.formData();
    const file = fd.get("file");
    const schemaNameRaw = String(fd.get("schemaName") ?? "");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Campo 'file' obrigatorio" },
        { status: 400 },
      );
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: `Arquivo passa de ${MAX_BYTES / 1024 / 1024}MB` },
        { status: 413 },
      );
    }
    if (!ALLOWED_MIMES.has(file.type)) {
      return NextResponse.json(
        { error: `Tipo nao permitido: ${file.type}. Use PDF ou imagem.` },
        { status: 415 },
      );
    }
    const schemaName = schemaNameValidator.parse(schemaNameRaw);

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileBase64 = buffer.toString("base64");

    const result = await extractPdfToFields({
      fileBase64,
      mediaType: file.type as
        | "application/pdf"
        | "image/jpeg"
        | "image/png"
        | "image/webp",
      schemaName,
    });

    return NextResponse.json(result);
  } catch (e) {
    return apiError(e);
  }
}
