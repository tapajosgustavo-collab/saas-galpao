import { NextResponse } from "next/server";
import { requireRole } from "@/lib/tenant";
import { apiError } from "@/lib/api";
import { Role } from "@prisma/client";
import {
  marcarAtrasadas,
  gerarAlertasVencimento,
  gerarAlertasDocumentos,
  gerarReceitasMes,
} from "@/lib/cron";

/**
 * Disparo manual de tarefa de cron — escopado ao tenant do admin logado.
 * Util para testar/forcar geracao sem esperar o scheduler.
 *
 * POST /api/cron/run/diario   — roda atrasadas + alertas SO no tenant atual
 * POST /api/cron/run/mensal   — gera receitas do mes corrente SO no tenant atual
 */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ type: string }> },
) {
  try {
    const ctx = await requireRole(Role.ADMIN, Role.GESTOR);
    const { type } = await params;

    switch (type) {
      case "diario": {
        const [atrasadas, alertasContratos, docs] = await Promise.all([
          marcarAtrasadas(ctx.tenantId),
          gerarAlertasVencimento(ctx.tenantId),
          gerarAlertasDocumentos(ctx.tenantId),
        ]);
        return NextResponse.json({
          ok: true,
          tenantId: ctx.tenantId,
          receitasMarcadasAtrasadas: atrasadas,
          alertasContratosVencendoCriados: alertasContratos,
          alertasDocumentosCriados: docs.alertasCriados,
          documentosStatusAtualizado: docs.statusAtualizados,
        });
      }
      case "mensal": {
        const r = await gerarReceitasMes({ tenantId: ctx.tenantId });
        return NextResponse.json({
          ok: true,
          tenantId: ctx.tenantId,
          ...r,
        });
      }
      default:
        return NextResponse.json(
          { error: "Tipo de cron desconhecido" },
          { status: 404 },
        );
    }
  } catch (e) {
    return apiError(e);
  }
}
