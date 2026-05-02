import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/tenant";
import { DocumentoForm } from "../form";

export default async function NovoDocumentoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await requireAuth();
  const { id } = await params;
  const galpao = await prisma.galpao.findFirst({
    where: { id, tenantId: ctx.tenantId },
    select: { id: true, nome: true },
  });
  if (!galpao) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <p className="text-xs text-slate-500">
          <Link href={`/galpoes/${id}/documentos`} className="hover:underline">
            ← Voltar aos documentos
          </Link>
        </p>
        <h1 className="text-3xl font-bold">Novo documento</h1>
        <p className="text-sm text-slate-500">{galpao.nome}</p>
      </div>
      <DocumentoForm galpaoId={id} mode="create" />
    </div>
  );
}
