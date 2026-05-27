"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AIAssist } from "@/components/ai-assist";

interface GalpaoOption {
  id: string;
  nome: string;
  cidade: string;
  estado: string;
}

interface ContratoFields {
  numero?: string;
  empresaLocataria?: string;
  cnpjLocataria?: string;
  emailLocataria?: string;
  telefoneLocataria?: string;
  dataInicio?: string;
  dataFim?: string;
  valorMensal?: number | string;
  diaVencimento?: number | string;
  reajusteAnual?: number | string;
  indiceReajuste?: string;
  status?: string;
}

export function ContratoForm({ galpoes }: { galpoes: GalpaoOption[] }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fields, setFields] = useState<ContratoFields>({});
  const [formKey, setFormKey] = useState(0);

  function applyAIFields(filled: Record<string, unknown>) {
    setFields(filled as ContratoFields);
    setFormKey((k) => k + 1);
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const payload = Object.fromEntries(fd.entries());
    const res = await fetch("/api/contratos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Erro ao criar contrato");
      return;
    }
    router.push("/contratos");
    router.refresh();
  }

  if (galpoes.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-slate-500">
          Você precisa cadastrar pelo menos um galpão disponível antes de criar um contrato.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <AIAssist
        schemaName="contrato"
        placeholder='Ex: "Contrato CT-2024-001 com Mercado Livre Brasil CNPJ 03.007.331/0001-41 de 01/01/2024 a 31/12/2026, R$ 142.500,00 mensais, reajuste anual 5% IPCA, vencimento dia 5"'
        helperText="Descreva o contrato em texto livre e a IA preenche o formulário."
        onFill={applyAIFields}
        accent="purple"
      />

      <Card>
        <CardHeader>
          <CardTitle>Dados do contrato</CardTitle>
        </CardHeader>
        <CardContent>
          <form key={formKey} onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="galpaoId">Galpão</Label>
              <select
                id="galpaoId"
                name="galpaoId"
                required
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {galpoes.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.nome} — {g.cidade}/{g.estado}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="numero">Número do contrato</Label>
                <Input
                  id="numero"
                  name="numero"
                  required
                  maxLength={50}
                  defaultValue={fields.numero ?? ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="diaVencimento">Dia de vencimento</Label>
                <Input
                  id="diaVencimento"
                  name="diaVencimento"
                  type="number"
                  min="1"
                  max="28"
                  defaultValue={fields.diaVencimento ?? 5}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="empresaLocataria">Empresa locatária</Label>
              <Input
                id="empresaLocataria"
                name="empresaLocataria"
                required
                maxLength={200}
                defaultValue={fields.empresaLocataria ?? ""}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cnpjLocataria">CNPJ</Label>
                <Input
                  id="cnpjLocataria"
                  name="cnpjLocataria"
                  required
                  placeholder="00.000.000/0000-00"
                  defaultValue={fields.cnpjLocataria ?? ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emailLocataria">Email (opcional)</Label>
                <Input
                  id="emailLocataria"
                  name="emailLocataria"
                  type="email"
                  defaultValue={fields.emailLocataria ?? ""}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dataInicio">Data início</Label>
                <Input
                  id="dataInicio"
                  name="dataInicio"
                  type="date"
                  required
                  defaultValue={fields.dataInicio ?? ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dataFim">Data fim</Label>
                <Input
                  id="dataFim"
                  name="dataFim"
                  type="date"
                  required
                  defaultValue={fields.dataFim ?? ""}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="valorMensal">Valor mensal (R$)</Label>
                <Input
                  id="valorMensal"
                  name="valorMensal"
                  type="number"
                  step="0.01"
                  required
                  min="0"
                  defaultValue={fields.valorMensal ?? ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reajusteAnual">Reajuste anual (%)</Label>
                <Input
                  id="reajusteAnual"
                  name="reajusteAnual"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="5"
                  defaultValue={fields.reajusteAnual ?? ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="indiceReajuste">Índice</Label>
                <Input
                  id="indiceReajuste"
                  name="indiceReajuste"
                  placeholder="IPCA"
                  defaultValue={fields.indiceReajuste ?? ""}
                />
              </div>
            </div>
            {error && <p className="rounded-md bg-red-50 p-2 text-sm text-red-700">{error}</p>}
            <div className="flex gap-2">
              <Button type="submit" disabled={loading}>
                {loading ? "Salvando..." : "Salvar"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/contratos")}
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
