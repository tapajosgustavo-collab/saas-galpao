"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

interface GalpaoOption {
  id: string;
  nome: string;
  cidade: string;
  estado: string;
}

const CATEGORIAS = [
  { value: "MANUTENCAO", label: "Manutencao" },
  { value: "IMPOSTOS", label: "Impostos" },
  { value: "SEGURO", label: "Seguro" },
  { value: "ENERGIA", label: "Energia" },
  { value: "AGUA", label: "Agua" },
  { value: "PESSOAL", label: "Pessoal" },
  { value: "OUTROS", label: "Outros" },
];

export function DespesaNovoForm({ galpoes }: { galpoes: GalpaoOption[] }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const hoje = new Date();
  const competenciaDefault = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
    .toISOString()
    .slice(0, 10);
  const vencimentoDefault = hoje.toISOString().slice(0, 10);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const payload = Object.fromEntries(fd.entries()) as Record<string, unknown>;
    if (payload.galpaoId === "") delete payload.galpaoId;
    if (payload.observacoes === "") delete payload.observacoes;
    payload.pago = fd.get("pago") === "on";

    const res = await fetch("/api/financeiro/despesas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Erro ao criar despesa");
      return;
    }
    router.push("/financeiro");
    router.refresh();
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="descricao">Descricao</Label>
            <Input
              id="descricao"
              name="descricao"
              required
              maxLength={200}
              placeholder="Ex: IPTU 1a parcela 2026"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="categoria">Categoria</Label>
              <select
                id="categoria"
                name="categoria"
                required
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {CATEGORIAS.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="galpaoId">Galpao (opcional)</Label>
              <select
                id="galpaoId"
                name="galpaoId"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">— Geral / sem vinculo —</option>
                {galpoes.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.nome} ({g.cidade}/{g.estado})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="competencia">Competencia</Label>
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
            <div className="space-y-2">
              <Label htmlFor="valor">Valor (R$)</Label>
              <Input
                id="valor"
                name="valor"
                type="number"
                step="0.01"
                required
                min="0"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="pago"
              name="pago"
              className="h-4 w-4 rounded border-input"
            />
            <Label htmlFor="pago" className="cursor-pointer">
              Ja foi pago
            </Label>
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
