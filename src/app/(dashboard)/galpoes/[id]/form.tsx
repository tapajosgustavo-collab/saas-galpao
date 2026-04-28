"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2 } from "lucide-react";

interface Props {
  galpao: {
    id: string;
    nome: string;
    endereco: string;
    cidade: string;
    estado: string;
    cep: string;
    tipo: string;
    status: string;
    metragemTotal: number;
    metragemDisponivel: number;
    valorPorM2: number;
    observacoes: string;
  };
  canDelete: boolean;
  hasActiveContracts: boolean;
}

export function GalpaoEditForm({ galpao, canDelete, hasActiveContracts }: Props) {
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
    const res = await fetch(`/api/galpoes/${galpao.id}`, {
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
    if (hasActiveContracts) {
      alert(
        "Nao e possivel excluir um galpao com contratos ativos. Encerre os contratos primeiro.",
      );
      return;
    }
    if (
      !confirm(
        `Tem certeza que deseja excluir o galpao "${galpao.nome}"? Esta acao nao pode ser desfeita.`,
      )
    ) {
      return;
    }
    setError(null);
    setDeleting(true);
    const res = await fetch(`/api/galpoes/${galpao.id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Erro ao excluir");
      setDeleting(false);
      return;
    }
    router.push("/galpoes");
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Editar galpao</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome</Label>
            <Input
              id="nome"
              name="nome"
              required
              defaultValue={galpao.nome}
              maxLength={120}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="endereco">Endereço</Label>
            <Input
              id="endereco"
              name="endereco"
              required
              defaultValue={galpao.endereco}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cidade">Cidade</Label>
              <Input
                id="cidade"
                name="cidade"
                required
                defaultValue={galpao.cidade}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="estado">UF</Label>
              <Input
                id="estado"
                name="estado"
                required
                defaultValue={galpao.estado}
                maxLength={2}
                minLength={2}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cep">CEP</Label>
              <Input id="cep" name="cep" required defaultValue={galpao.cep} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo</Label>
              <select
                id="tipo"
                name="tipo"
                required
                defaultValue={galpao.tipo}
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
              <Label htmlFor="metragemTotal">Total (m²)</Label>
              <Input
                id="metragemTotal"
                name="metragemTotal"
                type="number"
                step="0.01"
                required
                min="0"
                defaultValue={galpao.metragemTotal}
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
                defaultValue={galpao.metragemDisponivel}
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
                defaultValue={galpao.valorPorM2}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              name="status"
              defaultValue={galpao.status}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="DISPONIVEL">Disponível</option>
              <option value="OCUPADO">Ocupado</option>
              <option value="EM_NEGOCIACAO">Em negociação</option>
              <option value="MANUTENCAO">Manutenção</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Input
              id="observacoes"
              name="observacoes"
              defaultValue={galpao.observacoes}
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
                onClick={() => router.push("/galpoes")}
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
                title={
                  hasActiveContracts
                    ? "Galpao com contratos ativos nao pode ser excluido"
                    : undefined
                }
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
