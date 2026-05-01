import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError } from "@/lib/api";

/**
 * GET /api/invite/[token]
 * Endpoint publico — retorna info do convite se valido.
 * Usado pela pagina /aceitar-convite/[token].
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await params;
    if (!token || token.length < 32) {
      return NextResponse.json({ error: "Token invalido" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { inviteToken: token },
      select: {
        email: true,
        name: true,
        role: true,
        inviteExpires: true,
        active: true,
        tenant: { select: { name: true } },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Convite nao encontrado" }, { status: 404 });
    }
    if (user.active) {
      return NextResponse.json(
        { error: "Convite ja foi aceito" },
        { status: 410 },
      );
    }
    if (!user.inviteExpires || user.inviteExpires < new Date()) {
      return NextResponse.json({ error: "Convite expirado" }, { status: 410 });
    }

    return NextResponse.json({
      email: user.email,
      name: user.name,
      role: user.role,
      empresa: user.tenant.name,
    });
  } catch (e) {
    return apiError(e);
  }
}
