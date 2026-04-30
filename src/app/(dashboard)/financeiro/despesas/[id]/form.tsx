"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Trash2 } from "lucide-react";

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

interface Props {
  despesa: {
    id: string;
    galpaoId: string;
    descricao: string;
    categoria: string;
    competencia: string;
    vencimento: string;
    valor: number;
    pago: boolean;
    dataPagamento: string;
    observacoes: string;
  };
  galpoes: GalpaoOption[];
  canDelete: boolean;
}

export function DespesaEditForm({ despesa, galpoes, canDelete }: Props) {
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
    const payload = Object.fromEntries(fd.entries()) as Record<string, unknown>;
    if (payload.galpaoId === "") payload.galpaoId = null;
    if (payload.dataPagamento === "") payload.dataPagamento = null;
    if (payload.observacoes === "") delete payload.observacoes;
    payload.pago = fd.get("pago") === "on";

    const res = await fetch(`/api/financeiro/despesas/${despesa.id}`, {
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
    setSuccess("Alteracoes salvas");
    router.refresh();
  }

  async function onDelete() {
    if (!confirm("Excluir esta despesa? Acao irreversivel.")) return;
    setError(null);
    setDeleting(true);
    const res = await fetch(`/api/financeiro/despesas/${despesa.id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error ?? "Erro ao excluir");
      setDeleting(false);
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
              defaultValue={despesa.descricao}
              maxLength={200}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="categoria">Categoria</Label>
              <select
                id="categoria"
                name="categoria"
                required
                defaultValue={despesa.categoria}
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
                defaultValue={despesa.galpaoId}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">— Geral —</option>
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
                defaultValue={despesa.competencia}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vencimento">Vencimento</Label>
              <Input
                id="vencimento"
                name="vencimento"
                type="date"
                required
                defaultValue={despesa.vencimento}
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
                defaultValue={despesa.valor}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="pago"
                name="pago"
                defaultChecked={despesa.pago}
                className="h-4 w-4 rounded border-input"
              />
              <Label htmlFor="pago" className="cursor-pointer">
                Pago
              </Label>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dataPagamento">Data do pagamento</Label>
              <Input
                id="dataPagamento"
                name="dataPagamento"
                type="date"
                defaultValue={despesa.dataPagamento}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacoes">Observacoes</Label>
            <Input
              id="observacoes"
              name="observacoes"
              defaultValue={despesa.observacoes}
              maxLength={1000}
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
                {loading ? "Salvando..." : "Salvar"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/financeiro")}
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
