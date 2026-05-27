import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiKey } from "@/lib/api-key";
import { apiError } from "@/lib/api";
import { galpaoCreateSchema } from "@/lib/validators/galpao";
import { requireGalpaoSlot } from "@/lib/plan-limits";

/**
 * GET /api/v1/galpoes
 * Lista todos os galpões do tenant da API key.
 */
export async function GET(req: Request) {
  try {
    const ctx = await requireApiKey(req);
    const galpoes = await prisma.galpao.findMany({
      where: { tenantId: ctx.tenantId },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ data: galpoes });
  } catch (e) {
    return apiError(e);
  }
}

/**
 * POST /api/v1/galpoes
 * Cria um galpão. Sujeito ao limite do plano.
 */
export async function POST(req: Request) {
  try {
    const ctx = await requireApiKey(req);
    await requireGalpaoSlot(ctx.tenantId);
    const body = await req.json();
    const data = galpaoCreateSchema.parse(body);
    const galpao = await prisma.galpao.create({
      data: { ...data, tenantId: ctx.tenantId },
    });
    return NextResponse.json({ data: galpao }, { status: 201 });
  } catch (e) {
    return apiError(e);
  }
}
