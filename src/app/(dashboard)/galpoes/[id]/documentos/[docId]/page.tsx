import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/tenant";
import { DocumentoForm } from "../form";

export default async function DocumentoDetailPage({
  params,
}: {
  params: Promise<{ id: string; docId: string }>;
}) {
  const ctx = await requireAuth();
  const { id, docId } = await params;

  const documento = await prisma.documentoGalpao.findFirst({
    where: { id: docId, galpaoId: id, tenantId: ctx.tenantId },
    include: { galpao: { select: { nome: true } } },
  });
  if (!documento) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <p className="text-xs text-slate-500">
          <Link href={`/galpoes/${id}/documentos`} className="hover:underline">
            ← Voltar aos documentos
          </Link>
        </p>
        <h1 className="text-3xl font-bold">{documento.nome}</h1>
        <p className="text-sm text-slate-500">
          {documento.galpao.nome} · {documento.tipo.replace("_", " ")}
        </p>
      </div>
      <DocumentoForm
        galpaoId={id}
        mode="edit"
        canDelete={ctx.role === "ADMIN"}
        documento={{
          id: documento.id,
          tipo: documento.tipo,
          nome: documento.nome,
          numero: documento.numero ?? "",
          emissor: documento.emissor ?? "",
          dataEmissao: documento.dataEmissao
            ? documento.dataEmissao.toISOString().slice(0, 10)
            : "",
          dataValidade: documento.dataValidade.toISOString().slice(0, 10),
          frequenciaRenovacaoMeses:
            documento.frequenciaRenovacaoMeses === null
              ? ""
              : String(documento.frequenciaRenovacaoMeses),
          alertarDiasAntes: documento.alertarDiasAntes,
          status: documento.status,
          responsavelPagamento: documento.responsavelPagamento ?? "",
          documentoUrl: documento.documentoUrl ?? "",
          observacoes: documento.observacoes ?? "",
        }}
      />
    </div>
  );
}
