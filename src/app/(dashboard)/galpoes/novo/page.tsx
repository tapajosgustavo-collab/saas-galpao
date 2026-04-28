"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function NovoGalpaoPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const payload = Object.fromEntries(fd.entries());
    const res = await fetch("/api/galpoes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Erro ao criar galpão");
      return;
    }
    router.push("/galpoes");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-3xl font-bold">Novo galpão</h1>
      <Card>
        <CardHeader>
          <CardTitle>Dados do galpão</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome</Label>
              <Input id="nome" name="nome" required maxLength={120} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endereco">Endereço</Label>
              <Input id="endereco" name="endereco" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cidade">Cidade</Label>
                <Input id="cidade" name="cidade" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="estado">UF</Label>
                <Input
                  id="estado"
                  name="estado"
                  required
                  maxLength={2}
                  minLength={2}
                  placeholder="SP"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cep">CEP</Label>
                <Input id="cep" name="cep" required placeholder="00000-000" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tipo">Tipo</Label>
                <select
                  id="tipo"
                  name="tipo"
                  required
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="LOGISTICO">Logístico</option>
                  <option value="INDUSTRIAL">Industrial</option>
                  <option value="ARMAZENAMENTO">Armazenamento</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="metragemTotal">Metragem total (m²)</Label>
                <Input
                  id="metragemTotal"
                  name="metragemTotal"
                  type="number"
                  step="0.01"
                  required
                  min="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="metragemDisponivel">Disponível (m²)</Label>
                <Input
                  id="metragemDisponivel"
                  name="metragemDisponivel"
                  type="number"
                  step="0.01"
                  required
                  min="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="valorPorM2">Valor/m² (R$)</Label>
                <Input
                  id="valorPorM2"
                  name="valorPorM2"
                  type="number"
                  step="0.01"
                  required
                  min="0"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                name="status"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                defaultValue="DISPONIVEL"
              >
                <option value="DISPONIVEL">Disponível</option>
                <option value="OCUPADO">Ocupado</option>
                <option value="EM_NEGOCIACAO">Em negociação</option>
                <option value="MANUTENCAO">Manutenção</option>
              </select>
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
                onClick={() => router.push("/galpoes")}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
