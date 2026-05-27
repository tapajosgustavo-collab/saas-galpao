import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiKey } from "@/lib/api-key";
import { apiError } from "@/lib/api";

export async function GET(req: Request) {
  try {
    const ctx = await requireApiKey(req);
    const url = new URL(req.url);
    const status = url.searchParams.get("status");
    const contratos = await prisma.contrato.findMany({
      where: {
        tenantId: ctx.tenantId,
        ...(status ? { status: status as never } : {}),
      },
      orderBy: { createdAt: "desc" },
      include: { galpao: { select: { id: true, nome: true } } },
    });
    return NextResponse.json({ data: contratos });
  } catch (e) {
    return apiError(e);
  }
}
