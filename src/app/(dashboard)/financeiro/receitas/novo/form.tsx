"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

interface ContratoOption {
  id: string;
  label: string;
  valorMensal: number;
  diaVencimento: number;
}

export function ReceitaNovoForm({ contratos }: { contratos: ContratoOption[] }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<ContratoOption | undefined>(
    contratos[0],
  );

  // Defaults: competencia = mes atual (dia 1), vencimento = competencia + dia do contrato
  const hoje = new Date();
  const competenciaDefault = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
    .toISOString()
    .slice(0, 10);
  const vencimentoDefault = (() => {
    const dia = selected?.diaVencimento ?? 5;
    const d = new Date(hoje.getFullYear(), hoje.getMonth(), dia);
    return d.toISOString().slice(0, 10);
  })();

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const payload = Object.fromEntries(fd.entries());
    if (payload.observacoes === "") delete payload.observacoes;

    const res = await fetch("/api/financeiro/receitas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Erro ao criar receita");
      return;
    }
    router.push("/financeiro");
    router.refresh();
  }

  if (contratos.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-slate-500">
          Nenhum contrato ativo. Crie um contrato primeiro.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="contratoId">Contrato</Label>
            <select
              id="contratoId"
              name="contratoId"
              required
              defaultValue={contratos[0]?.id}
              onChange={(e) =>
                setSelected(contratos.find((c) => c.id === e.target.value))
              }
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {contratos.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="competencia">Competencia (mes/ano)</Label>
              <Input
                id="competencia"
                name="competencia"
                type="date"
                required
                defaultValue={competenciaDefault}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vencimento">Vencimento</Label>
              <Input
                id="vencimento"
                name="vencimento"
                type="date"
                required
                defaultValue={vencimentoDefault}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="valor">Valor (R$)</Label>
              <Input
                id="valor"
                name="valor"
                type="number"
                step="0.01"
                required
                min="0"
                defaultValue={selected?.valorMensal}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                name="status"
                defaultValue="PENDENTE"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="PENDENTE">Pendente</option>
                <option value="PAGO">Pago</option>
                <option value="PARCIAL">Parcial</option>
                <option value="ATRASADO">Atrasado</option>
                <option value="CANCELADO">Cancelado</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacoes">Observacoes</Label>
            <Input id="observacoes" name="observacoes" maxLength={1000} />
          </div>

          {error && (
            <p className="rounded-md bg-red-50 p-2 text-sm text-red-700">{error}</p>
          )}

          <div className="flex gap-2">
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : "Salvar"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/financeiro")}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
