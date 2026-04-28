import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/tenant";
import { apiError } from "@/lib/api";
import { analisarFinanceiro } from "@/lib/agents/financeiro";
import { gerarInsights } from "@/lib/agents/analitico";
import { analisarOperacao } from "@/lib/agents/operacional";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ type: string }> },
) {
  try {
    const ctx = await requireAuth();
    const { type } = await params;

    let text: string;
    switch (type) {
      case "financeiro":
        text = await analisarFinanceiro(ctx.tenantId);
        break;
      case "operacional":
        text = await analisarOperacao(ctx.tenantId);
        break;
      case "analitico":
        text = await gerarInsights(ctx.tenantId);
        break;
      default:
        return NextResponse.json({ error: "Agente desconhecido" }, { status: 404 });
    }

    return NextResponse.json({ text });
  } catch (e) {
    return apiError(e);
  }
}
