import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireRole } from "@/lib/tenant";
import { vistoriaUpdateSchema } from "@/lib/validators/vistoria";
import { apiError } from "@/lib/api";
import { Role, StatusVistoria } from "@prisma/client";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string; vId: string }> },
) {
  try {
    const ctx = await requireAuth();
    const { id, vId } = await params;

    const v = await prisma.vistoria.findFirst({
      where: { id: vId, contratoId: id, tenantId: ctx.tenantId },
      include: { itens: { orderBy: { ordem: "asc" } } },
    });
    if (!v) return NextResponse.json({ error: "Não encontrada" }, { status: 404 });
    return NextResponse.json(v);
  } catch (e) {
    return apiError(e);
  }
}

/**
 * Atualiza vistoria. Estrategia para itens: se vier array, substitui
 * todos (delete + create) numa transacao. Bloqueia edicao se status
 * = FINALIZADA — vistoria assinada nao deve mudar.
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; vId: string }> },
) {
  try {
    const ctx = await requireRole(Role.ADMIN, Role.GESTOR);
    const { id, vId } = await params;
    const body = await req.json();
    const data = vistoriaUpdateSchema.parse(body);

    const current = await prisma.vistoria.findFirst({
      where: { id: vId, contratoId: id, tenantId: ctx.tenantId },
      select: { status: true },
    });
    if (!current) {
      return NextResponse.json({ error: "Não encontrada" }, { status: 404 });
    }
    if (
      current.status === StatusVistoria.FINALIZADA &&
      data.status !== StatusVistoria.RASCUNHO
    ) {
      return NextResponse.json(
        {
          error:
            "Vistoria finalizada não pode ser editada. Reabra em RASCUNHO antes de alterar.",
        },
        { status: 400 },
      );
    }

    const { itens, ...vistoriaData } = data;

    const updated = await prisma.$transaction(async (tx) => {
      await tx.vistoria.updateMany({
        where: { id: vId, contratoId: id, tenantId: ctx.tenantId },
        data: vistoriaData,
      });

      if (itens !== undefined) {
        await tx.itemVistoria.deleteMany({ where: { vistoriaId: vId } });
        if (itens.length > 0) {
          await tx.itemVistoria.createMany({
            data: itens.map((it, idx) => ({
              ...it,
              vistoriaId: vId,
              ordem: it.ordem ?? idx,
            })),
          });
        }
      }

      return tx.vistoria.findUnique({
        where: { id: vId },
        include: { itens: { orderBy: { ordem: "asc" } } },
      });
    });

    return NextResponse.json(updated);
  } catch (e) {
    return apiError(e);
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; vId: string }> },
) {
  try {
    const ctx = await requireRole(Role.ADMIN);
    const { id, vId } = await params;
    const result = await prisma.vistoria.deleteMany({
      where: { id: vId, contratoId: id, tenantId: ctx.tenantId },
    });
    if (result.count === 0) {
      return NextResponse.json({ error: "Não encontrada" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return apiError(e);
  }
}
