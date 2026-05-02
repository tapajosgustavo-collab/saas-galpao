import { NextResponse } from "next/server";
import {
  assertCronAuth,
  CronUnauthorizedError,
  marcarAtrasadas,
  gerarAlertasVencimento,
  gerarAlertasDocumentos,
} from "@/lib/cron";

/**
 * Cron diario — disparado pela Vercel as 03:00 UTC todo dia.
 * Tarefas:
 * 1. Marcar receitas pendentes com vencimento passado como ATRASADAS
 * 2. Gerar alertas de contratos vencendo nos proximos 60 dias
 * 3. Gerar alertas de documentos (AVCB, IPTU, licencas) proximos do
 *    vencimento ou vencidos; atualiza status do documento.
 */
export async function GET(req: Request) {
  try {
    assertCronAuth(req);
    const startedAt = new Date();

    const [atrasadas, alertasContratos, docs] = await Promise.all([
      marcarAtrasadas(),
      gerarAlertasVencimento(),
      gerarAlertasDocumentos(),
    ]);

    return NextResponse.json({
      ok: true,
      startedAt: startedAt.toISOString(),
      durationMs: Date.now() - startedAt.getTime(),
      receitasMarcadasAtrasadas: atrasadas,
      alertasContratosVencendoCriados: alertasContratos,
      alertasDocumentosCriados: docs.alertasCriados,
      documentosStatusAtualizado: docs.statusAtualizados,
    });
  } catch (e) {
    if (e instanceof CronUnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[CRON DIARIO]", e);
    return NextResponse.json({ error: "Cron failed" }, { status: 500 });
  }
}
