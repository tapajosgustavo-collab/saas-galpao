import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireRole } from "@/lib/tenant";
import { documentoCreateSchema } from "@/lib/validators/documento";
import { apiError } from "@/lib/api";
import { Role } from "@prisma/client";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const ctx = await requireAuth();
    const { id } = await params;

    // Garante que o galpao pertence ao tenant
    const galpao = await prisma.galpao.findFirst({
      where: { id, tenantId: ctx.tenantId },
      select: { id: true },
    });
    if (!galpao) {
      return NextResponse.json({ error: "Galpão não encontrado" }, { status: 404 });
    }

    const documentos = await prisma.documentoGalpao.findMany({
      where: { tenantId: ctx.tenantId, galpaoId: id },
      orderBy: { dataValidade: "asc" },
    });
    return NextResponse.json(documentos);
  } catch (e) {
    return apiError(e);
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const ctx = await requireRole(Role.ADMIN, Role.GESTOR);
    const { id } = await params;

    const galpao = await prisma.galpao.findFirst({
      where: { id, tenantId: ctx.tenantId },
      select: { id: true },
    });
    if (!galpao) {
      return NextResponse.json({ error: "Galpão não encontrado" }, { status: 404 });
    }

    const body = await req.json();
    const data = documentoCreateSchema.parse(body);

    const documento = await prisma.documentoGalpao.create({
      data: { ...data, tenantId: ctx.tenantId, galpaoId: id },
    });
    return NextResponse.json(documento, { status: 201 });
  } catch (e) {
    return apiError(e);
  }
}
