import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiKey } from "@/lib/api-key";
import { apiError } from "@/lib/api";

export async function GET(req: Request) {
  try {
    const ctx = await requireApiKey(req);
    const url = new URL(req.url);
    const status = url.searchParams.get("status");
    const contratoId = url.searchParams.get("contratoId");
    const since = url.searchParams.get("since"); // ISO date — filtra vencimento>=since
    const take = Math.min(parseInt(url.searchParams.get("limit") ?? "100", 10), 500);

    const receitas = await prisma.receita.findMany({
      where: {
        tenantId: ctx.tenantId,
        ...(status ? { status: status as never } : {}),
        ...(contratoId ? { contratoId } : {}),
        ...(since ? { vencimento: { gte: new Date(since) } } : {}),
      },
      orderBy: { vencimento: "desc" },
      take,
      include: {
        contrato: {
          select: { id: true, numero: true, empresaLocataria: true, cnpjLocataria: true },
        },
      },
    });
    return NextResponse.json({ data: receitas });
  } catch (e) {
    return apiError(e);
  }
}
