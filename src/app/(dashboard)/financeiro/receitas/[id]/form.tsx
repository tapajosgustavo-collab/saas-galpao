"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Trash2 } from "lucide-react";

interface ContratoOption {
  id: string;
  numero: string;
  empresaLocataria: string;
}

interface Props {
  receita: {
    id: string;
    contratoId: string;
    competencia: string;
    vencimento: string;
    valor: number;
    valorPago: string;
    dataPagamento: string;
    status: string;
    observacoes: string;
  };
  contratos: ContratoOption[];
  canDelete: boolean;
}

export function ReceitaEditForm({ receita, contratos, canDelete }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [paying, setPaying] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const payload = Object.fromEntries(fd.entries()) as Record<string, unknown>;
    if (payload.valorPago === "") delete payload.valorPago;
    if (payload.dataPagamento === "") delete payload.dataPagamento;
    if (payload.observacoes === "") delete payload.observacoes;

    const res = await fetch(`/api/financeiro/receitas/${receita.id}`, {
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

  async function onPagar() {
    const valor = prompt(
      "Valor pago (R$):",
      receita.valorPago || String(receita.valor),
    );
    if (!valor) return;
    const data = prompt(
      "Data do pagamento (YYYY-MM-DD):",
      new Date().toISOString().slice(0, 10),
    );
    if (!data) return;

    setError(null);
    setPaying(true);
    const res = await fetch(`/api/financeiro/receitas/${receita.id}/pagar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ valorPago: valor, dataPagamento: data }),
    });
    setPaying(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error ?? "Erro ao registrar pagamento");
      return;
    }
    setSuccess("Pagamento registrado");
    router.refresh();
  }

  async function onDelete() {
    if (!confirm("Excluir esta receita? Acao irreversivel.")) return;
    setError(null);
    setDeleting(true);
    const res = await fetch(`/api/financeiro/receitas/${receita.id}`, {
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

  const jaPago = receita.status === "PAGO";

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
              defaultValue={receita.contratoId}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {contratos.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.numero} — {c.empresaLocataria}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="competencia">Competencia</Label>
              <Input
                id="competencia"
                name="competencia"
                type="date"
                required
                defaultValue={receita.competencia}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vencimento">Vencimento</Label>
              <Input
                id="vencimento"
                name="vencimento"
                type="date"
                required
                defaultValue={receita.vencimento}
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
                defaultValue={receita.valor}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                name="status"
                defaultValue={receita.status}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="PENDENTE">Pendente</option>
                <option value="PAGO">Pago</option>
                <option value="ATRASADO">Atrasado</option>
                <option value="CANCELADO">Cancelado</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="valorPago">Valor pago (R$)</Label>
              <Input
                id="valorPago"
                name="valorPago"
                type="number"
                step="0.01"
                min="0"
                defaultValue={receita.valorPago}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dataPagamento">Data do pagamento</Label>
              <Input
                id="dataPagamento"
                name="dataPagamento"
                type="date"
                defaultValue={receita.dataPagamento}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacoes">Observacoes</Label>
            <Input
              id="observacoes"
              name="observacoes"
              defaultValue={receita.observacoes}
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

          <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
            <div className="flex flex-wrap gap-2">
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
              {!jaPago && (
                <Button
                  type="button"
                  variant="default"
                  className="bg-green-600 hover:bg-green-700"
                  disabled={paying}
                  onClick={onPagar}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {paying ? "Registrando..." : "Marcar como pago"}
                </Button>
              )}
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
