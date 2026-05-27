"use client";

import { useRef, useState } from "react";
import { FileText, Loader2, Lock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

type SchemaName =
  | "galpao"
  | "contrato"
  | "manutencao"
  | "documento"
  | "vistoria";

interface Props {
  schemaName: SchemaName;
  /** Recebe os campos extraidos do PDF e devolve void (form preenche). */
  onExtracted: (fields: Record<string, unknown>) => void;
  helperText?: string;
  /** Mostra label custom no botao */
  buttonLabel?: string;
  accent?: "purple" | "blue" | "green";
}

const ACCENT_BG: Record<string, string> = {
  purple: "border-purple-200 bg-purple-50/30",
  blue: "border-blue-200 bg-blue-50/30",
  green: "border-green-200 bg-green-50/30",
};

const ACCENT_ICON: Record<string, string> = {
  purple: "text-purple-600",
  blue: "text-blue-600",
  green: "text-green-600",
};

export function PdfExtract({
  schemaName,
  onExtracted,
  helperText = "Faça upload do PDF ou foto. A IA lê e preenche os campos automaticamente.",
  buttonLabel = "Anexar PDF/imagem e extrair com IA",
  accent = "blue",
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [planBlocked, setPlanBlocked] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  async function handleFile(file: File) {
    setError(null);
    setInfo(null);
    setFileName(file.name);
    setLoading(true);

    const fd = new FormData();
    fd.set("file", file);
    fd.set("schemaName", schemaName);

    const res = await fetch("/api/ai-extract-pdf", {
      method: "POST",
      body: fd,
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
      setError(data.error ?? "Falha na extração");
      return;
    }
    const data = await res.json();
    const fields = (data?.fields ?? {}) as Record<string, unknown>;
    const source = data?.source as string | undefined;

    if (source === "mock" || Object.keys(fields).length === 0) {
      setInfo("IA ainda não ativada (sem ANTHROPIC_API_KEY). Preencha manualmente.");
      return;
    }
    setInfo(`✓ ${Object.keys(fields).length} campos extraídos do ${file.name}. Revise antes de salvar.`);
    onExtracted(fields);
    if (inputRef.current) inputRef.current.value = "";
  }

  if (planBlocked) {
    return (
      <div className={`rounded-lg border ${ACCENT_BG[accent]} p-4`}>
        <div className="flex items-start gap-3">
          <Lock className={`h-5 w-5 shrink-0 ${ACCENT_ICON[accent]}`} />
          <div className="flex-1 space-y-2 text-sm">
            <p className="font-medium">Extração de PDF disponível no plano Pro</p>
            <p className="text-slate-600">
              Mande o PDF do AVCB, IPTU, contrato ou NF e a IA preenche os
              campos automaticamente. Economiza minutos por documento.
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
        <FileText className={`h-4 w-4 ${ACCENT_ICON[accent]}`} />
        <span className="font-medium">Extrair de PDF com IA (opcional)</span>
        <span className="ml-auto text-xs text-slate-400">Pro+</span>
      </div>

      {helperText && (
        <p className="text-xs text-slate-600">{helperText}</p>
      )}

      <label
        className={`flex cursor-pointer items-center justify-center gap-2 rounded-md border-2 border-dashed bg-white px-4 py-3 text-sm transition hover:bg-slate-50 ${
          loading ? "pointer-events-none opacity-50" : ""
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,image/jpeg,image/png,image/webp"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
          disabled={loading}
        />
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Lendo {fileName ?? "arquivo"}...
          </>
        ) : (
          <>
            <FileText className="h-4 w-4" />
            {buttonLabel}
          </>
        )}
      </label>

      <p className="text-xs text-slate-400">
        Aceita PDF, JPG, PNG, WEBP. Máximo 10MB. Tempo médio: 5-15s por documento.
      </p>

      {error && (
        <div className="flex items-start gap-2 rounded-md bg-red-50 p-2 text-xs text-red-700">
          <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" />
          {error}
        </div>
      )}
      {info && !error && (
        <div className="rounded-md bg-green-50 p-2 text-xs text-green-800">
          {info}
        </div>
      )}
    </div>
  );
}
