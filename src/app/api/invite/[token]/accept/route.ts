import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { inviteAcceptSchema } from "@/lib/validators/usuario";
import { apiError } from "@/lib/api";

/**
 * POST /api/invite/[token]/accept
 * Endpoint publico — usuario define a senha e ativa a conta.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await params;
    const body = await req.json();
    const { password } = inviteAcceptSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { inviteToken: token },
      select: { id: true, active: true, inviteExpires: true },
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

    const passwordHash = await bcrypt.hash(password, 12);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        active: true,
        inviteToken: null,
        inviteExpires: null,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    return apiError(e);
  }
}
