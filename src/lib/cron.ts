import { prisma } from "@/lib/prisma";
import {
  StatusPagamento,
  StatusContrato,
  SeveridadeAlerta,
  TipoAlerta,
  StatusDocumento,
} from "@prisma/client";

export class CronUnauthorizedError extends Error {
  constructor(message = "Cron unauthorized") {
    super(message);
    this.name = "CronUnauthorizedError";
  }
}

/**
 * Valida que o request veio do scheduler da Vercel (ou de um admin
 * autorizado disparando manualmente). A Vercel envia automaticamente
 * o header `Authorization: Bearer ${CRON_SECRET}` nos crons em prod.
 */
export function assertCronAuth(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    // Em dev sem secret, permite. Em prod, exige.
    if (process.env.NODE_ENV === "production") {
      throw new CronUnauthorizedError("CRON_SECRET nao configurado");
    }
    return;
  }
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    throw new CronUnauthorizedError();
  }
}

// =========================================================
// MARCAR RECEITAS VENCIDAS COMO ATRASADAS
// =========================================================
export async function marcarAtrasadas(tenantId?: string) {
  const where = {
    status: StatusPagamento.PENDENTE,
    vencimento: { lt: new Date() },
    ...(tenantId ? { tenantId } : {}),
  };
  const result = await prisma.receita.updateMany({
    where,
    data: { status: StatusPagamento.ATRASADO },
  });
  return result.count;
}

// =========================================================
// GERAR ALERTAS DE CONTRATOS VENCENDO
// =========================================================
export async function gerarAlertasVencimento(tenantId?: string) {
  const dias60 = new Date();
  dias60.setDate(dias60.getDate() + 60);

  const contratos = await prisma.contrato.findMany({
    where: {
      status: StatusContrato.ATIVO,
      dataFim: { lte: dias60, gte: new Date() },
      ...(tenantId ? { tenantId } : {}),
    },
    select: {
      id: true,
      tenantId: true,
      numero: true,
      empresaLocataria: true,
      dataFim: true,
    },
  });

  let count = 0;
  for (const c of contratos) {
    const existing = await prisma.alerta.findFirst({
      where: {
        tenantId: c.tenantId,
        tipo: TipoAlerta.CONTRATO_VENCENDO,
        refType: "contrato",
        refId: c.id,
        lido: false,
      },
    });
    if (existing) continue;

    const dias = Math.floor(
      (c.dataFim.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
    );
    const sev: SeveridadeAlerta =
      dias < 15
        ? SeveridadeAlerta.CRITICAL
        : dias < 30
          ? SeveridadeAlerta.WARNING
          : SeveridadeAlerta.INFO;

    await prisma.alerta.create({
      data: {
        tenantId: c.tenantId,
        tipo: TipoAlerta.CONTRATO_VENCENDO,
        severidade: sev,
        titulo: `Contrato ${c.numero} vence em ${dias} dia${dias === 1 ? "" : "s"}`,
        mensagem: `Contrato com ${c.empresaLocataria} termina em ${c.dataFim.toISOString().slice(0, 10)}. Considere iniciar a renovacao.`,
        refType: "contrato",
        refId: c.id,
      },
    });
    count++;
  }
  return count;
}

// =========================================================
// GERAR ALERTAS DE DOCUMENTOS VENCENDO (AVCB, IPTU, licencas)
// =========================================================
export async function gerarAlertasDocumentos(tenantId?: string) {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  // Pega documentos cujo vencimento esta dentro da janela `alertarDiasAntes`
  // ou ja passou. Filtra fora os marcados como NAO_APLICA ou EM_RENOVACAO.
  const documentos = await prisma.documentoGalpao.findMany({
    where: {
      status: { notIn: [StatusDocumento.NAO_APLICA, StatusDocumento.EM_RENOVACAO] },
      ...(tenantId ? { tenantId } : {}),
    },
    select: {
      id: true,
      tenantId: true,
      tipo: true,
      nome: true,
      dataValidade: true,
      alertarDiasAntes: true,
      status: true,
      responsavelPagamento: true,
      galpao: { select: { nome: true } },
    },
  });

  let alertasCriados = 0;
  let statusAtualizados = 0;

  for (const d of documentos) {
    const ms = d.dataValidade.getTime() - hoje.getTime();
    const dias = Math.ceil(ms / (1000 * 60 * 60 * 24));

    // Atualiza status se mudou
    let novoStatus: StatusDocumento | null = null;
    if (dias < 0 && d.status !== StatusDocumento.VENCIDO) {
      novoStatus = StatusDocumento.VENCIDO;
    } else if (
      dias >= 0 &&
      dias <= d.alertarDiasAntes &&
      d.status === StatusDocumento.VIGENTE
    ) {
      novoStatus = StatusDocumento.PROXIMO_VENCIMENTO;
    }
    if (novoStatus) {
      await prisma.documentoGalpao.update({
        where: { id: d.id },
        data: { status: novoStatus },
      });
      statusAtualizados++;
    }

    // Gera alerta se esta dentro da janela ou vencido
    const dentroJanela = dias >= 0 && dias <= d.alertarDiasAntes;
    const vencido = dias < 0;
    if (!dentroJanela && !vencido) continue;

    const isIPTU = d.tipo === "IPTU";
    const tipoAlerta = isIPTU
      ? TipoAlerta.IPTU_PENDENTE
      : TipoAlerta.DOCUMENTO_VENCENDO;

    const existing = await prisma.alerta.findFirst({
      where: {
        tenantId: d.tenantId,
        tipo: tipoAlerta,
        refType: "documento",
        refId: d.id,
        lido: false,
      },
    });
    if (existing) continue;

    const sev: SeveridadeAlerta = vencido
      ? SeveridadeAlerta.CRITICAL
      : dias < 15
        ? SeveridadeAlerta.CRITICAL
        : dias < 30
          ? SeveridadeAlerta.WARNING
          : SeveridadeAlerta.INFO;

    const tipoLabel = d.tipo.replace("_", " ");
    const titulo = vencido
      ? `${tipoLabel} VENCIDO ha ${Math.abs(dias)} dia${Math.abs(dias) === 1 ? "" : "s"}`
      : `${tipoLabel} vence em ${dias} dia${dias === 1 ? "" : "s"}`;

    let mensagem = `${d.nome} (${d.galpao.nome}) — validade ${d.dataValidade.toISOString().slice(0, 10)}.`;
    if (isIPTU && d.responsavelPagamento === "LOCATARIA") {
      mensagem +=
        " Pagamento por conta da locataria. Cobre a prova de pagamento ou voce pode ter certidao negativa bloqueada.";
    }

    await prisma.alerta.create({
      data: {
        tenantId: d.tenantId,
        tipo: tipoAlerta,
        severidade: sev,
        titulo,
        mensagem,
        refType: "documento",
        refId: d.id,
      },
    });
    alertasCriados++;
  }

  return { alertasCriados, statusAtualizados };
}

// =========================================================
// GERAR RECEITAS DO MES CORRENTE
// =========================================================
export async function gerarReceitasMes(opts: {
  tenantId?: string;
  ano?: number;
  mes?: number; // 0-indexed (jan=0)
}) {
  const hoje = new Date();
  const ano = opts.ano ?? hoje.getFullYear();
  const mes = opts.mes ?? hoje.getMonth();

  const inicioMes = new Date(ano, mes, 1);
  const fimMes = new Date(ano, mes + 1, 1);

  const contratos = await prisma.contrato.findMany({
    where: {
      status: StatusContrato.ATIVO,
      dataInicio: { lt: fimMes },
      dataFim: { gte: inicioMes },
      ...(opts.tenantId ? { tenantId: opts.tenantId } : {}),
    },
    select: {
      id: true,
      tenantId: true,
      valorMensal: true,
      diaVencimento: true,
    },
  });

  let geradas = 0;
  let puladas = 0;

  for (const c of contratos) {
    const existing = await prisma.receita.findFirst({
      where: {
        tenantId: c.tenantId,
        contratoId: c.id,
        competencia: inicioMes,
      },
      select: { id: true },
    });
    if (existing) {
      puladas++;
      continue;
    }

    const dia = Math.min(c.diaVencimento, 28);
    const vencimento = new Date(ano, mes, dia);

    await prisma.receita.create({
      data: {
        tenantId: c.tenantId,
        contratoId: c.id,
        competencia: inicioMes,
        vencimento,
        valor: c.valorMensal,
        status: StatusPagamento.PENDENTE,
      },
    });
    geradas++;
  }

  return { geradas, puladas, totalContratos: contratos.length };
}
