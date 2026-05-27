import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/tenant";
import { apiError } from "@/lib/api";
import { requireAIAssist } from "@/lib/plan-limits";
import {
  fillFormFromText,
  SCHEMAS_BY_NAME,
  inputSchemaValidator,
} from "@/lib/agents/fill-form";

/**
 * POST /api/ai-assist
 * body: { schemaName: 'galpao'|'contrato'|'manutencao'|'documento'|'vistoria',
 *         description: string }
 *
 * Pede ao Claude pra extrair campos estruturados do texto livre seguindo o
 * schema do nome solicitado. Gateado pelo plano (Pro+).
 */
export async function POST(req: Request) {
  try {
    const ctx = await requireAuth();
    await requireAIAssist(ctx.tenantId);
    const body = await req.json();
    const { schemaName, description } = inputSchemaValidator.parse(body);

    const schemaJson = SCHEMAS_BY_NAME[schemaName];
    if (!schemaJson) {
      return NextResponse.json({ error: "Schema desconhecido" }, { status: 400 });
    }

    const result = await fillFormFromText({
      description,
      schemaName,
      schemaJson,
    });

    return NextResponse.json(result);
  } catch (e) {
    return apiError(e);
  }
}
