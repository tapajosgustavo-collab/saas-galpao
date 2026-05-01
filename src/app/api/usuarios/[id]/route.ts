import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/tenant";
import { usuarioUpdateSchema } from "@/lib/validators/usuario";
import { apiError } from "@/lib/api";
import { Role } from "@prisma/client";

/**
 * Atualiza um usuario do tenant — ADMIN apenas.
 * Permite mudar nome, role e ativar/desativar.
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const ctx = await requireRole(Role.ADMIN);
    const { id } = await params;

    if (id === ctx.userId) {
      // Impede o admin de se desativar/rebaixar sozinho (evita lock-out).
      const body = await req.json();
      const data = usuarioUpdateSchema.parse(body);
      if (data.active === false || (data.role && data.role !== Role.ADMIN)) {
        return NextResponse.json(
          {
            error:
              "Admin nao pode desativar ou rebaixar a propria conta. Outro admin precisa fazer isso.",
          },
          { status: 400 },
        );
      }
    }

    const body = await req.clone().json().catch(() => ({}));
    const data = usuarioUpdateSchema.parse(body);

    const result = await prisma.user.updateMany({
      where: { id, tenantId: ctx.tenantId },
      data,
    });
    if (result.count === 0) {
      return NextResponse.json({ error: "Nao encontrado" }, { status: 404 });
    }
    const updated = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        active: true,
      },
    });
    return NextResponse.json(updated);
  } catch (e) {
    return apiError(e);
  }
}

/**
 * Deleta um usuario do tenant — ADMIN apenas.
 * Nao permite o admin deletar a propria conta.
 */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const ctx = await requireRole(Role.ADMIN);
    const { id } = await params;

    if (id === ctx.userId) {
      return NextResponse.json(
        { error: "Admin nao pode deletar a propria conta." },
        { status: 400 },
      );
    }

    const result = await prisma.user.deleteMany({
      where: { id, tenantId: ctx.tenantId },
    });
    if (result.count === 0) {
      return NextResponse.json({ error: "Nao encontrado" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return apiError(e);
  }
}
