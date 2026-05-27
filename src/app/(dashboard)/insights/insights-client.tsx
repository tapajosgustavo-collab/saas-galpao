"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, TrendingUp, Building2, LineChart } from "lucide-react";

interface AgentCard {
  type: "financeiro" | "operacional" | "analitico";
  title: string;
  desc: string;
  icon: React.ReactNode;
}

const AGENTS: AgentCard[] = [
  {
    type: "analitico",
    title: "Agente Analítico",
    desc: "Insights estratégicos cruzando galpões, contratos e financeiro.",
    icon: <Sparkles className="h-5 w-5 text-primary" />,
  },
  {
    type: "financeiro",
    title: "Agente Financeiro",
    desc: "Análise de fluxo de caixa, inadimplência e sugestões de ajuste.",
    icon: <TrendingUp className="h-5 w-5 text-green-600" />,
  },
  {
    type: "operacional",
    title: "Agente Operacional",
    desc: "Detecta ociosidade e galpões subutilizados.",
    icon: <Building2 className="h-5 w-5 text-blue-600" />,
  },
];

export function InsightsClient() {
  const [results, setResults] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<string | null>(null);

  async function rodar(type: string) {
    setLoading(type);
    const res = await fetch(`/api/agents/${type}`, { method: "POST" });
    setLoading(null);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setResults((p) => ({ ...p, [type]: `Erro: ${data.error ?? "falha"}` }));
      return;
    }
    const data = await res.json();
    setResults((p) => ({ ...p, [type]: data.text }));
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-3xl font-bold">
          <LineChart className="h-7 w-7 text-primary" />
          Insights de IA
        </h1>
        <p className="text-sm text-slate-500">
          Análises automáticas geradas por agentes Claude. Resposta em ~10 segundos.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {AGENTS.map((a) => (
          <Card key={a.type}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                {a.icon}
                {a.title}
              </CardTitle>
              <CardDescription>{a.desc}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => rodar(a.type)}
                disabled={loading === a.type}
                className="w-full"
              >
                {loading === a.type ? "Analisando..." : "Rodar análise"}
              </Button>
              {results[a.type] && (
                <pre className="mt-4 whitespace-pre-wrap rounded-md bg-slate-50 p-3 text-xs text-slate-700">
                  {results[a.type]}
                </pre>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
