"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Zap, Calendar, RefreshCw, Mail } from "lucide-react";

interface ResultadoCron {
  ok?: boolean;
  geradas?: number;
  puladas?: number;
  totalContratos?: number;
  receitasMarcadasAtrasadas?: number;
  alertasContratosVencendoCriados?: number;
  alertasDocumentosCriados?: number;
  documentosStatusAtualizado?: number;
  error?: string;
}

export function AutomationPanel({ showEmailTest = false }: { showEmailTest?: boolean }) {
  const router = useRouter();
  const [running, setRunning] = useState<"diario" | "mensal" | "email" | null>(
    null,
  );
  const [resultado, setResultado] = useState<ResultadoCron | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [emailMsg, setEmailMsg] = useState<string | null>(null);

  async function rodar(type: "diario" | "mensal") {
    setRunning(type);
    setErro(null);
    setResultado(null);
    setEmailMsg(null);

    const res = await fetch(`/api/cron/run/${type}`, { method: "POST" });
    setRunning(null);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setErro(data.error ?? "Erro ao executar");
      return;
    }
    const data = (await res.json()) as ResultadoCron;
    setResultado(data);
    router.refresh();
  }

  async function testEmail() {
    setRunning("email");
    setErro(null);
    setEmailMsg(null);

    const res = await fetch("/api/test-email", { method: "POST" });
    setRunning(null);
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setErro(data.error ?? "Erro ao enviar email");
      return;
    }
    if (data.sent) {
      setEmailMsg(`Email enviado (id ${data.id ?? "?"}). Cheque sua caixa de entrada.`);
    } else {
      setErro(
        data.reason === "no-api-key"
          ? "RESEND_API_KEY nao configurada na Vercel."
          : `Falhou: ${data.reason ?? "erro desconhecido"}`,
      );
    }
  }

  return (
    <Card className="border-blue-200 bg-blue-50/40">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Zap className="h-5 w-5 text-blue-600" />
          Automacao (admin)
        </CardTitle>
        <CardDescription>
          Roda agora as tarefas automaticas. Em producao, executam sozinhas
          (diario as 03h UTC; mensal no dia 1 as 04h UTC).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid gap-2 md:grid-cols-2">
          <Button
            variant="outline"
            disabled={running !== null}
            onClick={() => rodar("mensal")}
          >
            <Calendar className="h-4 w-4" />
            {running === "mensal"
              ? "Gerando..."
              : "Gerar receitas do mes corrente"}
          </Button>
          <Button
            variant="outline"
            disabled={running !== null}
            onClick={() => rodar("diario")}
          >
            <RefreshCw className="h-4 w-4" />
            {running === "diario"
              ? "Atualizando..."
              : "Atualizar atrasadas + alertas"}
          </Button>
        </div>

        {showEmailTest && (
          <Button
            variant="outline"
            size="sm"
            disabled={running !== null}
            onClick={testEmail}
            className="w-full"
          >
            <Mail className="h-4 w-4" />
            {running === "email" ? "Enviando..." : "Enviar email de teste (super admin)"}
          </Button>
        )}

        {emailMsg && (
          <p className="rounded-md bg-green-50 p-2 text-xs text-green-800">
            {emailMsg}
          </p>
        )}

        {erro && (
          <p className="rounded-md bg-red-50 p-2 text-xs text-red-700">{erro}</p>
        )}

        {resultado && resultado.ok && (
          <div className="rounded-md bg-green-50 p-3 text-xs text-green-900">
            <p className="font-medium">Concluido</p>
            <ul className="mt-1 list-inside list-disc space-y-0.5 text-green-800">
              {resultado.geradas !== undefined && (
                <li>
                  Receitas geradas: <strong>{resultado.geradas}</strong> (de{" "}
                  {resultado.totalContratos} contratos ativos,{" "}
                  {resultado.puladas} ja existiam)
                </li>
              )}
              {resultado.receitasMarcadasAtrasadas !== undefined && (
                <li>
                  Receitas marcadas como atrasadas:{" "}
                  <strong>{resultado.receitasMarcadasAtrasadas}</strong>
                </li>
              )}
              {resultado.alertasContratosVencendoCriados !== undefined && (
                <li>
                  Alertas criados (contratos vencendo):{" "}
                  <strong>{resultado.alertasContratosVencendoCriados}</strong>
                </li>
              )}
              {resultado.alertasDocumentosCriados !== undefined && (
                <li>
                  Alertas criados (documentos vencendo):{" "}
                  <strong>{resultado.alertasDocumentosCriados}</strong>
                </li>
              )}
              {resultado.documentosStatusAtualizado !== undefined &&
                resultado.documentosStatusAtualizado > 0 && (
                  <li>
                    Documentos com status atualizado:{" "}
                    <strong>{resultado.documentosStatusAtualizado}</strong>
                  </li>
                )}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
