"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2 } from "lucide-react";

interface GalpaoOption {
  id: string;
  nome: string;
  cidade: string;
  estado: string;
}

interface Props {
  contrato: {
    id: string;
    galpaoId: string;
    numero: string;
    empresaLocataria: string;
    cnpjLocataria: string;
    emailLocataria: string;
    telefoneLocataria: string;
    dataInicio: string; // YYYY-MM-DD
    dataFim: string;
    valorMensal: number;
    diaVencimento: number;
    reajusteAnual: string;
    indiceReajuste: string;
    status: string;
    observacoes: string;
  };
  galpoes: GalpaoOption[];
  canDelete: boolean;
}

export function ContratoEditForm({ contrato, galpoes, canDelete }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const payload = Object.fromEntries(fd.entries());
    // Remove campos vazios opcionais para o partial schema nao fazer coercion errada
    if (payload.reajusteAnual === "") delete payload.reajusteAnual;
    if (payload.indiceReajuste === "") delete payload.indiceReajuste;
    if (payload.emailLocataria === "") delete payload.emailLocataria;
    if (payload.telefoneLocataria === "") delete payload.telefoneLocataria;
    if (payload.observacoes === "") delete payload.observacoes;

    const res = await fetch(`/api/contratos/${contrato.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Erro ao salvar");
      return;
    }
    setSuccess("Alteracoes salvas com sucesso");
    router.refresh();
  }

  async function onDelete() {
    if (
      !confirm(
        `Excluir contrato ${contrato.numero}? Todas as cobrancas vinculadas tambem serao removidas. Esta acao nao pode ser desfeita.`,
      )
    ) {
      return;
    }
    setError(null);
    setDeleting(true);
    const res = await fetch(`/api/contratos/${contrato.id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Erro ao excluir");
      setDeleting(false);
      return;
    }
    router.push("/contratos");
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Editar contrato</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="galpaoId">Galpao</Label>
            <select
              id="galpaoId"
              name="galpaoId"
              required
              defaultValue={contrato.galpaoId}
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
              <Label htmlFor="numero">Numero do contrato</Label>
              <Input
                id="numero"
                name="numero"
                required
                defaultValue={contrato.numero}
                maxLength={50}
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
                defaultValue={contrato.diaVencimento}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="empresaLocataria">Empresa locataria</Label>
            <Input
              id="empresaLocataria"
              name="empresaLocataria"
              required
              defaultValue={contrato.empresaLocataria}
              maxLength={200}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cnpjLocataria">CNPJ</Label>
              <Input
                id="cnpjLocataria"
                name="cnpjLocataria"
                required
                defaultValue={contrato.cnpjLocataria}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emailLocataria">Email (opcional)</Label>
              <Input
                id="emailLocataria"
                name="emailLocataria"
                type="email"
                defaultValue={contrato.emailLocataria}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="telefoneLocataria">Telefone (opcional)</Label>
              <Input
                id="telefoneLocataria"
                name="telefoneLocataria"
                defaultValue={contrato.telefoneLocataria}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                name="status"
                defaultValue={contrato.status}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="ATIVO">Ativo</option>
                <option value="ENCERRADO">Encerrado</option>
                <option value="CANCELADO">Cancelado</option>
                <option value="PENDENTE">Pendente</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dataInicio">Data inicio</Label>
              <Input
                id="dataInicio"
                name="dataInicio"
                type="date"
                required
                defaultValue={contrato.dataInicio}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dataFim">Data fim</Label>
              <Input
                id="dataFim"
                name="dataFim"
                type="date"
                required
                defaultValue={contrato.dataFim}
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
                defaultValue={contrato.valorMensal}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reajusteAnual">Reajuste (%)</Label>
              <Input
                id="reajusteAnual"
                name="reajusteAnual"
                type="number"
                step="0.01"
                min="0"
                defaultValue={contrato.reajusteAnual}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="indiceReajuste">Indice</Label>
              <Input
                id="indiceReajuste"
                name="indiceReajuste"
                defaultValue={contrato.indiceReajuste}
                placeholder="IPCA"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacoes">Observacoes</Label>
            <Input
              id="observacoes"
              name="observacoes"
              defaultValue={contrato.observacoes}
              maxLength={2000}
            />
          </div>

          {error && (
            <p className="rounded-md bg-red-50 p-2 text-sm text-red-700">{error}</p>
          )}
          {success && (
            <p className="rounded-md bg-green-50 p-2 text-sm text-green-700">
              {success}
            </p>
          )}

          <div className="flex items-center justify-between gap-2 pt-2">
            <div className="flex gap-2">
              <Button type="submit" disabled={loading}>
                {loading ? "Salvando..." : "Salvar alteracoes"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/contratos")}
              >
                Voltar
              </Button>
            </div>
            {canDelete && (
              <Button
                type="button"
                variant="destructive"
                disabled={deleting}
                onClick={onDelete}
              >
                <Trash2 className="h-4 w-4" />
                {deleting ? "Excluindo..." : "Excluir"}
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
