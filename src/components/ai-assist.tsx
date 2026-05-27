"use client";

import { useState } from "react";
import { Sparkles, Loader2, Lock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

type SchemaName =
  | "galpao"
  | "contrato"
  | "manutencao"
  | "documento"
  | "vistoria";

interface Props {
  schemaName: SchemaName;
  placeholder: string;
  helperText?: string;
  /** Recebe os campos extraidos pelo Claude e devolve void (form preenche). */
  onFill: (fields: Record<string, unknown>) => void;
  /** Cor do destaque (azul, roxo, etc) — default 'primary'. */
  accent?: "primary" | "purple" | "blue" | "green";
}

const ACCENT_BG: Record<string, string> = {
  primary: "border-primary/30 bg-primary/5",
  purple: "border-purple-200 bg-purple-50/30",
  blue: "border-blue-200 bg-blue-50/30",
  green: "border-green-200 bg-green-50/30",
};

const ACCENT_ICON: Record<string, string> = {
  primary: "text-primary",
  purple: "text-purple-600",
  blue: "text-blue-600",
  green: "text-green-600",
};

export function AIAssist({
  schemaName,
  placeholder,
  helperText,
  onFill,
  accent = "purple",
}: Props) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [planBlocked, setPlanBlocked] = useState(false);

  async function run() {
    if (text.trim().length < 3) {
      setError("Escreve um pouco mais (mínimo 3 caracteres)");
      return;
    }
    setError(null);
    setInfo(null);
    setLoading(true);

    const res = await fetch("/api/ai-assist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ schemaName, description: text }),
    });

    setLoading(false);

    if (res.status === 402) {
      setPlanBlocked(true);
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Disponível no plano Pro");
      return;
    }
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Falha");
      return;
    }
    const data = await res.json();
    const fields = (data?.fields ?? {}) as Record<string, unknown>;
    const source = data?.source as string | undefined;

    if (source === "mock" || Object.keys(fields).length === 0) {
      setInfo(
        "IA ainda não ativada (sem ANTHROPIC_API_KEY). Preencha manualmente abaixo.",
      );
      return;
    }
    setInfo(`Campos preenchidos! Revise antes de salvar.`);
    onFill(fields);
  }

  if (planBlocked) {
    return (
      <div className={`rounded-lg border ${ACCENT_BG[accent]} p-4`}>
        <div className="flex items-start gap-3">
          <Lock className={`h-5 w-5 shrink-0 ${ACCENT_ICON[accent]}`} />
          <div className="flex-1 space-y-2 text-sm">
            <p className="font-medium">
              Assistente IA disponível no plano Pro
            </p>
            <p className="text-slate-600">
              Descreva em texto livre e a IA preenche o formulário pra você.
              Economiza minutos por cadastro.
            </p>
            <Button asChild size="sm">
              <a href="/configuracoes/plano">Ver planos</a>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-lg border ${ACCENT_BG[accent]} p-4 space-y-3`}>
      <div className="flex items-center gap-2 text-sm">
        <Sparkles className={`h-4 w-4 ${ACCENT_ICON[accent]}`} />
        <span className="font-medium">
          Preencher com IA (opcional)
        </span>
        <span className="ml-auto text-xs text-slate-400">Pro+</span>
      </div>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        placeholder={placeholder}
        className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
      />

      {helperText && (
        <p className="text-xs text-slate-500">{helperText}</p>
      )}

      <div className="flex items-center gap-2">
        <Button
          type="button"
          onClick={run}
          disabled={loading || text.trim().length < 3}
          size="sm"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Analisando...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Preencher formulário com IA
            </>
          )}
        </Button>
        {text && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setText("");
              setError(null);
              setInfo(null);
            }}
          >
            Limpar
          </Button>
        )}
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-md bg-red-50 p-2 text-xs text-red-700">
          <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" />
          {error}
        </div>
      )}
      {info && (
        <div className="rounded-md bg-green-50 p-2 text-xs text-green-800">
          ✓ {info}
        </div>
      )}
    </div>
  );
}
