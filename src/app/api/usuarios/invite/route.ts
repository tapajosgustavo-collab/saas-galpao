import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/tenant";
import { apiError } from "@/lib/api";
import { inviteCreateSchema } from "@/lib/validators/usuario";
import { requireUserSlot } from "@/lib/plan-limits";
import { Role } from "@prisma/client";

const INVITE_TTL_DAYS = 7;

/**
 * Cria um convite. So ADMIN pode convidar.
 *
 * Implementacao: cria um User com:
 *  - inviteToken (rand 32 bytes hex, unique)
 *  - inviteExpires (now + 7 dias)
 *  - passwordHash placeholder (vai ser substituido no accept)
 *  - active = false
 *
 * Retorna o link que o admin deve compartilhar manualmente.
 * Sem SMTP por enquanto — link fica visivel na UI.
 */
export async function POST(req: Request) {
  try {
    const ctx = await requireRole(Role.ADMIN);
    await requireUserSlot(ctx.tenantId);
    const body = await req.json();
    const data = inviteCreateSchema.parse(body);
    const email = data.email.toLowerCase();

    // Email ja existe (em qualquer tenant)?
    const existing = await prisma.user.findUnique({
      where: { email },
      select: { id: true, tenantId: true, active: true, inviteToken: true },
    });
    if (existing) {
      if (existing.tenantId !== ctx.tenantId) {
        return NextResponse.json(
          { error: "Email ja cadastrado em outra empresa" },
          { status: 409 },
        );
      }
      if (existing.active) {
        return NextResponse.json(
          { error: "Usuario ja existe e esta ativo" },
          { status: 409 },
        );
      }
      // E pending no mesmo tenant — gera novo token (renova convite)
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date();
    expires.setDate(expires.getDate() + INVITE_TTL_DAYS);

    // Hash de placeholder seguro (nunca sera usado pra login,
    // pois active=false bloqueia. Sera substituido no accept.)
    const placeholderHash = crypto.randomBytes(32).toString("hex");

    const user = existing
      ? await prisma.user.update({
          where: { id: existing.id },
          data: {
            name: data.name,
            role: data.role,
            inviteToken: token,
            inviteExpires: expires,
            invitedBy: ctx.userId,
          },
          select: { id: true },
        })
      : await prisma.user.create({
          data: {
            tenantId: ctx.tenantId,
            email,
            name: data.name,
            role: data.role,
            passwordHash: placeholderHash,
            active: false,
            inviteToken: token,
            inviteExpires: expires,
            invitedBy: ctx.userId,
          },
          select: { id: true },
        });

    const baseUrl = process.env.NEXTAUTH_URL ?? process.env.APP_URL ?? "";
    const acceptUrl = `${baseUrl}/aceitar-convite/${token}`;

    return NextResponse.json(
      {
        ok: true,
        userId: user.id,
        email,
        acceptUrl,
        expiresAt: expires.toISOString(),
      },
      { status: 201 },
    );
  } catch (e) {
    return apiError(e);
  }
}
