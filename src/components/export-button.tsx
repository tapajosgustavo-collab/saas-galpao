"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ExportButton({
  type,
  galpaoId,
  label,
  variant = "outline",
}: {
  type: "galpoes" | "contratos" | "receitas" | "despesas" | "manutencoes";
  galpaoId?: string;
  label?: string;
  variant?: "default" | "outline";
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function exportar() {
    setError(null);
    setLoading(true);
    try {
      const url = new URL(`/api/export/${type}`, window.location.origin);
      if (galpaoId) url.searchParams.set("galpaoId", galpaoId);
      const res = await fetch(url.toString());
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(j.error ?? "Falha na exportacao");
        return;
      }
      const blob = await res.blob();
      const filename =
        res.headers
          .get("content-disposition")
          ?.match(/filename="([^"]+)"/)?.[1] ?? `${type}.xlsx`;
      const a = document.createElement("a");
      const objUrl = URL.createObjectURL(blob);
      a.href = objUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(objUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha na exportacao");
    }
    setLoading(false);
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button variant={variant} onClick={exportar} disabled={loading}>
        <Download className="h-4 w-4" />
        {loading ? "Gerando..." : (label ?? "Exportar Excel")}
      </Button>
      {error && (
        <span className="text-xs text-red-700">{error}</span>
      )}
    </div>
  );
}
