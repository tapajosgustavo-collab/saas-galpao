import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireRole } from "@/lib/tenant";
import { documentoUpdateSchema } from "@/lib/validators/documento";
import { apiError } from "@/lib/api";
import { Role } from "@prisma/client";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string; docId: string }> },
) {
  try {
    const ctx = await requireAuth();
    const { id, docId } = await params;
    const documento = await prisma.documentoGalpao.findFirst({
      where: { id: docId, galpaoId: id, tenantId: ctx.tenantId },
    });
    if (!documento) {
      return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
    }
    return NextResponse.json(documento);
  } catch (e) {
    return apiError(e);
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; docId: string }> },
) {
  try {
    const ctx = await requireRole(Role.ADMIN, Role.GESTOR);
    const { id, docId } = await params;
    const body = await req.json();
    const data = documentoUpdateSchema.parse(body);

    const result = await prisma.documentoGalpao.updateMany({
      where: { id: docId, galpaoId: id, tenantId: ctx.tenantId },
      data,
    });
    if (result.count === 0) {
      return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
    }
    const updated = await prisma.documentoGalpao.findUnique({ where: { id: docId } });
    return NextResponse.json(updated);
  } catch (e) {
    return apiError(e);
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; docId: string }> },
) {
  try {
    const ctx = await requireRole(Role.ADMIN);
    const { id, docId } = await params;
    const result = await prisma.documentoGalpao.deleteMany({
      where: { id: docId, galpaoId: id, tenantId: ctx.tenantId },
    });
    if (result.count === 0) {
      return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return apiError(e);
  }
}
