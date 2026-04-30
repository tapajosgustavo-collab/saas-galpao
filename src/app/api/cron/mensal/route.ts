import { NextResponse } from "next/server";
import {
  assertCronAuth,
  CronUnauthorizedError,
  gerarReceitasMes,
} from "@/lib/cron";

/**
 * Cron mensal — disparado pela Vercel no dia 1 de cada mes as 04:00 UTC.
 * Tarefa: gerar receitas (PENDENTE) para todos os contratos ATIVO do
 * tenant no mes corrente. Idempotente — se ja existir uma receita pra
 * o (contratoId, competencia=dia 1 do mes), pula.
 */
export async function GET(req: Request) {
  try {
    assertCronAuth(req);
    const startedAt = new Date();

    const result = await gerarReceitasMes({});

    return NextResponse.json({
      ok: true,
      startedAt: startedAt.toISOString(),
      durationMs: Date.now() - startedAt.getTime(),
      ...result,
    });
  } catch (e) {
    if (e instanceof CronUnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[CRON MENSAL]", e);
    return NextResponse.json({ error: "Cron failed" }, { status: 500 });
  }
}
