"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Check,
  CheckCheck,
  ExternalLink,
  Trash2,
  AlertTriangle,
  Info,
  AlertCircle,
} from "lucide-react";

interface Alerta {
  id: string;
  tipo: string;
  severidade: string;
  titulo: string;
  mensagem: string;
  refType: string | null;
  refId: string | null;
  createdAt: string;
}

const SEV_VARIANT: Record<string, "destructive" | "warning" | "secondary"> = {
  CRITICAL: "destructive",
  WARNING: "warning",
  INFO: "secondary",
};

const SEV_ICON: Record<string, React.ReactNode> = {
  CRITICAL: <AlertCircle className="h-4 w-4 text-red-600" />,
  WARNING: <AlertTriangle className="h-4 w-4 text-amber-600" />,
  INFO: <Info className="h-4 w-4 text-slate-500" />,
};

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

function refLink(refType: string | null, refId: string | null): string | null {
  if (!refType || !refId) return null;
  switch (refType) {
    case "contrato":
      return `/contratos/${refId}`;
    case "galpao":
      return `/galpoes/${refId}`;
    case "documento":
      // refId aponta pro documento; nao temos o galpaoId aqui — abrimos no /galpoes
      // generico, mas o usuario pode pivotar. Idealmente armazenariamos galpaoId
      // tambem. Por ora redireciona pra lista geral de galpoes.
      return `/galpoes`;
    default:
      return null;
  }
}

export function AlertasClient({
  naoLidos,
  lidosRecentes,
}: {
  naoLidos: Alerta[];
  lidosRecentes: Alerta[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  async function marcarLido(id: string) {
    setBusy(id);
    const res = await fetch(`/api/alertas/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lido: true }),
    });
    setBusy(null);
    if (res.ok) router.refresh();
  }

  async function marcarTodosLidos() {
    if (!confirm("Marcar todos os alertas nao-lidos como lidos?")) return;
    setBusy("all");
    const res = await fetch("/api/alertas/mark-all-read", { method: "POST" });
    setBusy(null);
    if (res.ok) router.refresh();
  }

  async function excluir(id: string) {
    if (!confirm("Excluir este alerta?")) return;
    setBusy(id);
    const res = await fetch(`/api/alertas/${id}`, { method: "DELETE" });
    setBusy(null);
    if (res.ok) router.refresh();
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">
              Não lidos ({naoLidos.length})
            </CardTitle>
            {naoLidos.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={marcarTodosLidos}
                disabled={busy === "all"}
              >
                <CheckCheck className="h-4 w-4" />
                Marcar todos como lidos
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {naoLidos.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-500">
              🎉 Nenhuma pendência. Tudo em ordem.
            </p>
          ) : (
            <div className="space-y-2">
              {naoLidos.map((a) => {
                const link = refLink(a.refType, a.refId);
                return (
                  <div
                    key={a.id}
                    className={`flex items-start gap-3 rounded-md border p-3 ${
                      a.severidade === "CRITICAL"
                        ? "border-red-200 bg-red-50/40"
                        : a.severidade === "WARNING"
                          ? "border-amber-200 bg-amber-50/40"
                          : "bg-slate-50/40"
                    }`}
                  >
                    <div className="mt-0.5">{SEV_ICON[a.severidade]}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{a.titulo}</p>
                        <Badge variant={SEV_VARIANT[a.severidade] ?? "secondary"}>
                          {a.severidade}
                        </Badge>
                      </div>
                      <p className="mt-0.5 text-sm text-slate-600">{a.mensagem}</p>
                      <p className="mt-1 text-xs text-slate-400">
                        {formatDateTime(a.createdAt)}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      {link && (
                        <Button asChild size="sm" variant="ghost" title="Abrir">
                          <Link href={link}>
                            <ExternalLink className="h-3 w-3" />
                          </Link>
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => marcarLido(a.id)}
                        disabled={busy === a.id}
                        title="Marcar como lido"
                      >
                        <Check className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => excluir(a.id)}
                        disabled={busy === a.id}
                        title="Excluir"
                        className="text-red-600"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {lidosRecentes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base text-slate-500">
              Lidos recentemente ({lidosRecentes.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 opacity-60">
              {lidosRecentes.map((a) => (
                <div
                  key={a.id}
                  className="flex items-start gap-3 rounded-md border p-2 text-sm"
                >
                  <div className="mt-0.5">{SEV_ICON[a.severidade]}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{a.titulo}</p>
                    <p className="text-xs text-slate-500">{a.mensagem}</p>
                  </div>
                  <span className="text-xs text-slate-400">
                    {formatDateTime(a.createdAt)}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => excluir(a.id)}
                    disabled={busy === a.id}
                    className="text-red-600"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
