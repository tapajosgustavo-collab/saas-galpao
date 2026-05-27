import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiKey } from "@/lib/api-key";
import { apiError } from "@/lib/api";

/**
 * GET /api/v1/alertas?onlyUnread=true&type=CONTRATO_VENCENDO
 * Lista alertas do tenant. Util pra ERP/dashboard externos consultarem
 * pendencias ("o que precisa de atencao essa semana?").
 */
export async function GET(req: Request) {
  try {
    const ctx = await requireApiKey(req);
    const url = new URL(req.url);
    const onlyUnread = url.searchParams.get("onlyUnread") === "true";
    const tipo = url.searchParams.get("type");
    const take = Math.min(parseInt(url.searchParams.get("limit") ?? "100", 10), 500);

    const alertas = await prisma.alerta.findMany({
      where: {
        tenantId: ctx.tenantId,
        ...(onlyUnread ? { lido: false } : {}),
        ...(tipo ? { tipo: tipo as never } : {}),
      },
      orderBy: [{ lido: "asc" }, { severidade: "desc" }, { createdAt: "desc" }],
      take,
    });
    return NextResponse.json({ data: alertas });
  } catch (e) {
    return apiError(e);
  }
}
