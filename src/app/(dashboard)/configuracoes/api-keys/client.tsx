"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Copy, AlertTriangle } from "lucide-react";

interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  lastUsedAt: string | null;
  expiresAt: string | null;
  revokedAt: string | null;
  createdAt: string;
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR");
}

function formatDateTime(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

export function ApiKeysClient({ initialKeys }: { initialKeys: ApiKey[] }) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newlyCreated, setNewlyCreated] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/admin/api-keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() }),
    });
    setLoading(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "Falha");
      return;
    }
    const d = await res.json();
    setNewlyCreated(d.data.key);
    setCreating(false);
    setName("");
    router.refresh();
  }

  async function onRevoke(id: string, name: string) {
    if (!confirm(`Revogar chave "${name}"? Integrações vão parar de funcionar.`)) return;
    const res = await fetch(`/api/admin/api-keys/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "Falha ao revogar");
      return;
    }
    router.refresh();
  }

  async function copyToClipboard(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  }

  return (
    <div className="space-y-6">
      {/* Modal/banner com chave nova */}
      {newlyCreated && (
        <Card className="border-2 border-green-500 bg-green-50/40">
          <CardHeader>
            <CardTitle className="text-base text-green-900">
              Chave criada — copie agora
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-2 rounded-md bg-amber-100 p-3 text-sm text-amber-900">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>
                Essa é a única vez que a chave completa aparece. Salve num
                gerenciador de senhas. Se perder, gere outra (a perda não
                afeta as outras chaves).
              </p>
            </div>
            <div className="flex items-center gap-2">
              <code className="flex-1 overflow-x-auto rounded-md bg-slate-900 px-3 py-2 font-mono text-xs text-slate-100">
                {newlyCreated}
              </code>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(newlyCreated)}
              >
                <Copy className="h-3 w-3" />
                {copied ? "Copiado!" : "Copiar"}
              </Button>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setNewlyCreated(null)}
            >
              Fechar (já salvei)
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Form de criar */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Chaves ativas</CardTitle>
            {!creating && (
              <Button size="sm" onClick={() => setCreating(true)}>
                <Plus className="h-4 w-4" />
                Nova chave
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {creating && (
            <form onSubmit={onCreate} className="mb-4 space-y-3 rounded-md border bg-slate-50/40 p-3">
              <div className="space-y-2">
                <Label htmlFor="key-name">Nome da chave</Label>
                <Input
                  id="key-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: TOTVS Integration"
                  required
                  minLength={2}
                  maxLength={120}
                  autoFocus
                />
                <p className="text-xs text-slate-500">
                  Use um nome descritivo (qual sistema/ambiente vai usar).
                </p>
              </div>
              {error && (
                <p className="rounded-md bg-red-50 p-2 text-xs text-red-700">{error}</p>
              )}
              <div className="flex gap-2">
                <Button type="submit" size="sm" disabled={loading || name.trim().length < 2}>
                  {loading ? "Gerando..." : "Gerar chave"}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setCreating(false);
                    setName("");
                    setError(null);
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          )}

          {initialKeys.length === 0 && !creating && (
            <p className="py-6 text-center text-sm text-slate-500">
              Nenhuma chave gerada ainda.
            </p>
          )}

          {initialKeys.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b text-left text-slate-500">
                  <tr>
                    <th className="pb-2 font-medium">Nome</th>
                    <th className="pb-2 font-medium">Prefixo</th>
                    <th className="pb-2 font-medium">Criada</th>
                    <th className="pb-2 font-medium">Último uso</th>
                    <th className="pb-2 font-medium">Status</th>
                    <th className="pb-2 font-medium" />
                  </tr>
                </thead>
                <tbody>
                  {initialKeys.map((k) => {
                    const revogada = !!k.revokedAt;
                    const expirada = k.expiresAt && new Date(k.expiresAt) < new Date();
                    return (
                      <tr key={k.id} className="border-b last:border-0">
                        <td className="py-3 font-medium">{k.name}</td>
                        <td className="py-3 font-mono text-xs text-slate-400">
                          {k.keyPrefix}...
                        </td>
                        <td className="py-3 text-xs">{formatDate(k.createdAt)}</td>
                        <td className="py-3 text-xs">
                          {formatDateTime(k.lastUsedAt)}
                        </td>
                        <td className="py-3">
                          {revogada ? (
                            <Badge variant="destructive">Revogada</Badge>
                          ) : expirada ? (
                            <Badge variant="warning">Expirada</Badge>
                          ) : (
                            <Badge variant="success">Ativa</Badge>
                          )}
                        </td>
                        <td className="py-3 text-right">
                          {!revogada && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => onRevoke(k.id, k.name)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-3 w-3" />
                              Revogar
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Documentação rápida */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Endpoints disponíveis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-xs">
          <Endpoint method="GET" path="/api/v1/galpoes" desc="Lista galpões" />
          <Endpoint method="POST" path="/api/v1/galpoes" desc="Cria galpão" />
          <Endpoint method="GET" path="/api/v1/galpoes/[id]" desc="Detalhe + contratos ativos" />
          <Endpoint method="PATCH" path="/api/v1/galpoes/[id]" desc="Atualiza campos" />
          <Endpoint method="GET" path="/api/v1/contratos?status=ATIVO" desc="Lista contratos (filtro opcional)" />
          <Endpoint method="GET" path="/api/v1/contratos/[id]" desc="Detalhe + últimas 24 receitas" />
          <Endpoint method="GET" path="/api/v1/receitas?status=PENDENTE&since=2026-01-01" desc="Lista receitas (filtros)" />
          <Endpoint method="POST" path="/api/v1/receitas/[id]/pagar" desc="Marca como pago (uso TOTVS)" />
          <Endpoint method="GET" path="/api/v1/alertas?onlyUnread=true" desc="Lista alertas pendentes" />
          <div className="mt-3 rounded-md bg-slate-100 p-3 font-mono text-[11px] text-slate-700">
            curl -H &quot;Authorization: Bearer sk_live_...&quot; \<br />
            &nbsp;&nbsp;&quot;{process.env.NEXTAUTH_URL ?? "https://saas-galpao.vercel.app"}/api/v1/galpoes&quot;
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Endpoint({ method, path, desc }: { method: string; path: string; desc: string }) {
  const methodColor: Record<string, string> = {
    GET: "bg-blue-100 text-blue-800",
    POST: "bg-green-100 text-green-800",
    PATCH: "bg-amber-100 text-amber-800",
    DELETE: "bg-red-100 text-red-800",
  };
  return (
    <div className="flex items-center gap-2">
      <span className={`rounded px-1.5 py-0.5 font-mono text-[10px] font-bold ${methodColor[method] ?? ""}`}>
        {method}
      </span>
      <code className="text-slate-700">{path}</code>
      <span className="text-slate-400">— {desc}</span>
    </div>
  );
}
