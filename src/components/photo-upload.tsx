"use client";

import { useRef, useState } from "react";
import { Upload, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function PhotoUpload({
  folder,
  urls,
  onChange,
  maxFiles = 10,
  label,
  accept = "image/*",
  compact = false,
}: {
  folder: "manutencoes" | "vistorias" | "documentos" | "geral";
  urls: string[];
  onChange: (urls: string[]) => void;
  maxFiles?: number;
  label?: string;
  accept?: string;
  compact?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError(null);

    const remaining = maxFiles - urls.length;
    const toUpload = Array.from(files).slice(0, remaining);
    if (toUpload.length === 0) {
      setError(`Limite de ${maxFiles} arquivos atingido`);
      return;
    }

    setUploading(true);
    setProgress({ done: 0, total: toUpload.length });
    const novos: string[] = [];

    for (let i = 0; i < toUpload.length; i++) {
      const file = toUpload[i]!;
      const fd = new FormData();
      fd.set("file", file);
      fd.set("folder", folder);
      try {
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "Falha no upload");
          break;
        }
        novos.push(data.url);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Falha no upload");
        break;
      }
      setProgress({ done: i + 1, total: toUpload.length });
    }

    if (novos.length > 0) onChange([...urls, ...novos]);
    setUploading(false);
    setProgress(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  function removeAt(index: number) {
    onChange(urls.filter((_, i) => i !== index));
  }

  const cellSize = compact ? "h-16 w-16" : "aspect-square";

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-xs font-medium text-slate-700">{label}</label>
      )}

      <div className={cn("grid gap-2", compact ? "grid-cols-6" : "grid-cols-4")}>
        {urls.map((url, i) => {
          const isPdf = url.toLowerCase().endsWith(".pdf");
          return (
            <div
              key={url + i}
              className={cn("group relative overflow-hidden rounded border bg-slate-100", cellSize)}
            >
              {isPdf ? (
                <a
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-full w-full items-center justify-center text-xs text-red-700"
                >
                  PDF
                </a>
              ) : (
                <a href={url} target="_blank" rel="noreferrer" className="block h-full w-full">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" className="h-full w-full object-cover" />
                </a>
              )}
              <button
                type="button"
                onClick={() => removeAt(i)}
                className="absolute right-1 top-1 rounded-full bg-red-600 p-0.5 text-white opacity-0 transition group-hover:opacity-100"
                aria-label="Remover"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          );
        })}

        {urls.length < maxFiles && (
          <label
            className={cn(
              "flex cursor-pointer flex-col items-center justify-center gap-1 rounded border-2 border-dashed bg-slate-50 text-xs text-slate-500 transition hover:bg-slate-100",
              cellSize,
              uploading && "pointer-events-none opacity-50",
            )}
          >
            <input
              ref={inputRef}
              type="file"
              accept={accept}
              multiple
              hidden
              onChange={(e) => handleFiles(e.target.files)}
              disabled={uploading}
            />
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Upload className="h-4 w-4" />
                <span>{compact ? "+" : "Anexar"}</span>
              </>
            )}
          </label>
        )}
      </div>

      {progress && (
        <p className="text-xs text-slate-500">
          Enviando {progress.done}/{progress.total}...
        </p>
      )}
      {error && (
        <p className="rounded-md bg-red-50 p-2 text-xs text-red-700">{error}</p>
      )}

      {urls.length > 0 && !uploading && (
        <p className="text-xs text-slate-400">
          {urls.length} arquivo{urls.length === 1 ? "" : "s"} (max {maxFiles}).
          Clique em uma imagem pra abrir; passe o mouse pra remover.
        </p>
      )}
    </div>
  );
}

/**
 * Versao single-file pra campos como "URL do PDF do contrato".
 * Salva uma string ao inves de array.
 */
export function SingleFileUpload({
  folder,
  url,
  onChange,
  label,
  accept = "application/pdf",
}: {
  folder: "manutencoes" | "vistorias" | "documentos" | "geral";
  url: string;
  onChange: (url: string) => void;
  label?: string;
  accept?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setError(null);
    setUploading(true);
    const fd = new FormData();
    fd.set("file", file);
    fd.set("folder", folder);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Falha no upload");
      } else {
        onChange(data.url);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha no upload");
    }
    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-xs font-medium text-slate-700">{label}</label>
      )}
      <div className="flex items-center gap-2">
        {url ? (
          <>
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="flex-1 truncate rounded-md border bg-slate-50 px-3 py-2 text-xs text-primary hover:underline"
            >
              {url.split("/").pop() ?? url}
            </a>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onChange("")}
            >
              <X className="h-3 w-3" /> Remover
            </Button>
          </>
        ) : (
          <label className="flex flex-1 cursor-pointer items-center gap-2 rounded-md border-2 border-dashed bg-slate-50 px-3 py-2 text-xs text-slate-500 hover:bg-slate-100">
            <input
              ref={inputRef}
              type="file"
              accept={accept}
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
              disabled={uploading}
            />
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Enviando...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" /> Anexar arquivo
              </>
            )}
          </label>
        )}
      </div>
      {error && (
        <p className="rounded-md bg-red-50 p-2 text-xs text-red-700">{error}</p>
      )}
    </div>
  );
}
