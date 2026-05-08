"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Calendar, X, Edit3 } from "lucide-react";

interface SubData {
  id: string;
  plan: string;
  status: string;
  trialEndsAt: string;
  currentPeriodEnd: string;
  notes: string;
}

interface TenantRow {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  adminEmail: string;
  adminName: string;
  galpoes: number;
  contratos: number;
  users: number;
  sub: SubData | null;
}

const STATUS_VARIANT: Record<string, "success" | "warning" | "destructive" | "secondary"> = {
  TRIALING: "warning",
  ACTIVE: "success",
  PAST_DUE: "destructive",
  CANCELED: "secondary",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR");
}

export function TenantsAdminClient({ tenants }: { tenants: TenantRow[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function action(
    sub: SubData,
    type: "activate-month" | "activate-year" | "extend-trial-30" | "cancel",
  ) {
    const labels: Record<typeof type, string> = {
      "activate-month": "Ativar por 1 mês",
      "activate-year": "Ativar por 1 ano",
      "extend-trial-30": "Estender trial em 30 dias",
      cancel: "Cancelar assinatura",
    };
    if (!confirm(`Confirma: ${labels[type]}?`)) return;
    setBusy(sub.id);
    setError(null);
    const res = await fetch(`/api/admin/subscriptions/${sub.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: type }),
    });
    setBusy(null);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error ?? "Erro");
      return;
    }
    router.refresh();
  }

  async function changePlan(sub: SubData, plan: string) {
    setBusy(sub.id);
    setError(null);
    const res = await fetch(`/api/admin/subscriptions/${sub.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan }),
    });
    setBusy(null);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error ?? "Erro");
      return;
    }
    router.refresh();
  }

  async function saveNotes(sub: SubData, notes: string) {
    setBusy(sub.id);
    setError(null);
    const res = await fetch(`/api/admin/subscriptions/${sub.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes }),
    });
    setBusy(null);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error ?? "Erro");
      return;
    }
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Lista de tenants</CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <p className="mb-3 rounded-md bg-red-50 p-2 text-sm text-red-700">{error}</p>
        )}
        <div className="space-y-4">
          {tenants.map((t) => (
            <div
              key={t.id}
              className="rounded-md border bg-slate-50/40 p-4 space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-base font-semibold">{t.name}</p>
                    <code className="text-xs text-slate-400">{t.slug}</code>
                  </div>
                  <p className="text-xs text-slate-500">
                    Admin: {t.adminEmail} · {t.adminName}
                  </p>
                  <p className="text-xs text-slate-400">
                    Cadastrado em {formatDate(t.createdAt)} ·{" "}
                    {t.galpoes} galpões · {t.contratos} contratos · {t.users} usuários
                  </p>
                </div>
                {t.sub && (
                  <Badge variant={STATUS_VARIANT[t.sub.status] ?? "secondary"}>
                    {t.sub.status}
                  </Badge>
                )}
              </div>

              {t.sub && (
                <>
                  <div className="grid gap-2 text-xs md:grid-cols-3">
                    <div className="rounded-md bg-white p-2">
                      <p className="text-slate-500">Plano atual</p>
                      <select
                        defaultValue={t.sub.plan}
                        disabled={busy === t.sub.id}
                        onChange={(e) => changePlan(t.sub!, e.target.value)}
                        className="mt-1 h-8 w-full rounded border border-input bg-background px-2 text-xs"
                      >
                        <option value="STARTER">STARTER</option>
                        <option value="PRO">PRO</option>
                        <option value="BUSINESS">BUSINESS</option>
                        <option value="ENTERPRISE">ENTERPRISE</option>
                      </select>
                    </div>
                    <div className="rounded-md bg-white p-2">
                      <p className="text-slate-500">Trial termina</p>
                      <p className="font-medium">{formatDate(t.sub.trialEndsAt)}</p>
                    </div>
                    <div className="rounded-md bg-white p-2">
                      <p className="text-slate-500">Período termina</p>
                      <p className="font-medium">
                        {formatDate(t.sub.currentPeriodEnd)}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="default"
                      disabled={busy === t.sub.id}
                      onClick={() => action(t.sub!, "activate-month")}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle2 className="h-3 w-3" /> Ativar 1 mês
                    </Button>
                    <Button
                      size="sm"
                      variant="default"
                      disabled={busy === t.sub.id}
                      onClick={() => action(t.sub!, "activate-year")}
                      className="bg-green-700 hover:bg-green-800"
                    >
                      <CheckCircle2 className="h-3 w-3" /> Ativar 1 ano
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busy === t.sub.id}
                      onClick={() => action(t.sub!, "extend-trial-30")}
                    >
                      <Calendar className="h-3 w-3" /> +30d trial
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={busy === t.sub.id}
                      onClick={() => action(t.sub!, "cancel")}
                    >
                      <X className="h-3 w-3" /> Cancelar
                    </Button>
                  </div>

                  <details>
                    <summary className="cursor-pointer text-xs text-slate-500">
                      <Edit3 className="mr-1 inline h-3 w-3" />
                      Notas internas
                    </summary>
                    <div className="mt-2 flex gap-2">
                      <input
                        type="text"
                        defaultValue={t.sub.notes}
                        placeholder="Ex: pagou Pix em 10/05 R$ 499"
                        id={`notes-${t.sub.id}`}
                        className="flex-1 rounded-md border border-input bg-white px-2 py-1 text-xs"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busy === t.sub.id}
                        onClick={() => {
                          const el = document.getElementById(
                            `notes-${t.sub!.id}`,
                          ) as HTMLInputElement;
                          saveNotes(t.sub!, el.value);
                        }}
                      >
                        Salvar nota
                      </Button>
                    </div>
                  </details>
                </>
              )}

              {!t.sub && (
                <p className="rounded-md bg-amber-50 p-2 text-xs text-amber-800">
                  ⚠️ Sem assinatura criada — algo errado.
                </p>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
