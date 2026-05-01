import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/tenant";
import { apiError } from "@/lib/api";

/**
 * Lista os usuarios do tenant atual.
 * Inclui pendentes (com invite ainda nao aceito) e ativos.
 */
export async function GET() {
  try {
    const ctx = await requireAuth();
    const usuarios = await prisma.user.findMany({
      where: { tenantId: ctx.tenantId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        active: true,
        inviteToken: true,
        inviteExpires: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json(usuarios);
  } catch (e) {
    return apiError(e);
  }
}
