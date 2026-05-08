import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/tenant";
import { apiError } from "@/lib/api";
import { buildXlsx, xlsxHeaders, type Coluna } from "@/lib/excel";

/**
 * GET /api/export/[type]?galpaoId=...
 * type: galpoes | contratos | receitas | despesas | manutencoes
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ type: string }> },
) {
  try {
    const ctx = await requireAuth();
    const { type } = await params;
    const url = new URL(req.url);
    const galpaoId = url.searchParams.get("galpaoId") ?? undefined;
    const today = new Date().toISOString().slice(0, 10);

    switch (type) {
      case "galpoes": {
        const data = await prisma.galpao.findMany({
          where: { tenantId: ctx.tenantId },
          orderBy: { nome: "asc" },
        });
        type Row = (typeof data)[number];
        const cols: Array<
          Coluna<Row> & { type?: "money" | "date" | "number" }
        > = [
          { header: "Nome", key: "nome", width: 30 },
          { header: "Endereco", key: "endereco", width: 40 },
          { header: "Cidade", key: "cidade" },
          { header: "UF", key: "estado", width: 6 },
          { header: "CEP", key: "cep" },
          { header: "Tipo", key: "tipo" },
          {
            header: "Metragem total (m²)",
            key: "metragemTotal",
            type: "number",
            format: (v) => Number(v),
          },
          {
            header: "Disponivel (m²)",
            key: "metragemDisponivel",
            type: "number",
            format: (v) => Number(v),
          },
          {
            header: "Valor/m² (R$)",
            key: "valorPorM2",
            type: "money",
            format: (v) => Number(v),
          },
          { header: "Status", key: "status" },
        ];
        const buf = await buildXlsx("Galpoes", data, cols);
        return new Response(new Uint8Array(buf), {
          headers: xlsxHeaders(`galpoes_${today}.xlsx`),
        });
      }

      case "contratos": {
        const data = await prisma.contrato.findMany({
          where: { tenantId: ctx.tenantId },
          orderBy: { dataInicio: "desc" },
          include: { galpao: { select: { nome: true } } },
        });
        type Row = (typeof data)[number];
        const cols: Array<
          Coluna<Row> & { type?: "money" | "date" | "number" }
        > = [
          { header: "Numero", key: "numero", width: 16 },
          { header: "Empresa locataria", key: "empresaLocataria", width: 32 },
          { header: "CNPJ", key: "cnpjLocataria", width: 18 },
          {
            header: "Galpao",
            key: "galpaoId",
            width: 24,
            format: (_v, row) => row.galpao.nome,
          },
          {
            header: "Data inicio",
            key: "dataInicio",
            type: "date",
            format: (v) => v as Date,
          },
          {
            header: "Data fim",
            key: "dataFim",
            type: "date",
            format: (v) => v as Date,
          },
          {
            header: "Valor mensal",
            key: "valorMensal",
            type: "money",
            format: (v) => Number(v),
          },
          { header: "Dia venc.", key: "diaVencimento", width: 10 },
          {
            header: "Reajuste (%)",
            key: "reajusteAnual",
            format: (v) => (v === null ? "" : Number(v)),
          },
          { header: "Indice", key: "indiceReajuste", width: 10 },
          { header: "Status", key: "status" },
        ];
        const buf = await buildXlsx("Contratos", data, cols);
        return new Response(new Uint8Array(buf), {
          headers: xlsxHeaders(`contratos_${today}.xlsx`),
        });
      }

      case "receitas": {
        const data = await prisma.receita.findMany({
          where: { tenantId: ctx.tenantId },
          orderBy: { vencimento: "desc" },
          include: {
            contrato: {
              select: { numero: true, empresaLocataria: true },
            },
          },
        });
        type Row = (typeof data)[number];
        const cols: Array<
          Coluna<Row> & { type?: "money" | "date" | "number" }
        > = [
          {
            header: "Contrato",
            key: "contratoId",
            width: 18,
            format: (_v, row) => row.contrato.numero,
          },
          {
            header: "Locataria",
            key: "contratoId",
            width: 30,
            format: (_v, row) => row.contrato.empresaLocataria,
          },
          {
            header: "Competencia",
            key: "competencia",
            type: "date",
            format: (v) => v as Date,
          },
          {
            header: "Vencimento",
            key: "vencimento",
            type: "date",
            format: (v) => v as Date,
          },
          {
            header: "Valor",
            key: "valor",
            type: "money",
            format: (v) => Number(v),
          },
          {
            header: "Valor pago",
            key: "valorPago",
            type: "money",
            format: (v) => (v === null ? "" : Number(v)),
          },
          {
            header: "Data pagamento",
            key: "dataPagamento",
            type: "date",
            format: (v) => (v === null ? null : (v as Date)),
          },
          { header: "Status", key: "status" },
        ];
        const buf = await buildXlsx("Receitas", data, cols);
        return new Response(new Uint8Array(buf), {
          headers: xlsxHeaders(`receitas_${today}.xlsx`),
        });
      }

      case "despesas": {
        const data = await prisma.despesa.findMany({
          where: { tenantId: ctx.tenantId },
          orderBy: { vencimento: "desc" },
        });
        type Row = (typeof data)[number];
        const cols: Array<
          Coluna<Row> & { type?: "money" | "date" | "number" }
        > = [
          { header: "Descricao", key: "descricao", width: 36 },
          { header: "Categoria", key: "categoria" },
          {
            header: "Competencia",
            key: "competencia",
            type: "date",
            format: (v) => v as Date,
          },
          {
            header: "Vencimento",
            key: "vencimento",
            type: "date",
            format: (v) => v as Date,
          },
          {
            header: "Valor",
            key: "valor",
            type: "money",
            format: (v) => Number(v),
          },
          {
            header: "Pago",
            key: "pago",
            format: (v) => (v ? "Sim" : "Nao"),
          },
          {
            header: "Data pagamento",
            key: "dataPagamento",
            type: "date",
            format: (v) => (v === null ? null : (v as Date)),
          },
        ];
        const buf = await buildXlsx("Despesas", data, cols);
        return new Response(new Uint8Array(buf), {
          headers: xlsxHeaders(`despesas_${today}.xlsx`),
        });
      }

      case "manutencoes": {
        const data = await prisma.manutencao.findMany({
          where: {
            tenantId: ctx.tenantId,
            ...(galpaoId ? { galpaoId } : {}),
          },
          orderBy: { dataInicio: "desc" },
          include: {
            galpao: { select: { nome: true } },
            contrato: { select: { numero: true } },
          },
        });
        type Row = (typeof data)[number];
        const cols: Array<
          Coluna<Row> & { type?: "money" | "date" | "number" }
        > = [
          {
            header: "Galpao",
            key: "galpaoId",
            width: 24,
            format: (_v, row) => row.galpao.nome,
          },
          {
            header: "Contrato",
            key: "contratoId",
            width: 16,
            format: (_v, row) => row.contrato?.numero ?? "",
          },
          { header: "Tipo", key: "tipo" },
          { header: "Categoria", key: "categoria" },
          { header: "Descricao", key: "descricao", width: 40 },
          { header: "Prestador", key: "prestador", width: 28 },
          { header: "CNPJ/CPF", key: "prestadorCnpj", width: 18 },
          {
            header: "Inicio",
            key: "dataInicio",
            type: "date",
            format: (v) => v as Date,
          },
          {
            header: "Fim",
            key: "dataFim",
            type: "date",
            format: (v) => (v === null ? null : (v as Date)),
          },
          {
            header: "Valor",
            key: "valor",
            type: "money",
            format: (v) => Number(v),
          },
          { header: "Pago por", key: "pagoPor" },
          { header: "Status", key: "status" },
        ];
        const buf = await buildXlsx("Manutencoes", data, cols);
        return new Response(new Uint8Array(buf), {
          headers: xlsxHeaders(`manutencoes_${today}.xlsx`),
        });
      }

      default:
        return NextResponse.json(
          { error: "Tipo de exportacao desconhecido" },
          { status: 400 },
        );
    }
  } catch (e) {
    return apiError(e);
  }
}
