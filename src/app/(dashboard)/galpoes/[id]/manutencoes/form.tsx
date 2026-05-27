"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, ImageIcon } from "lucide-react";
import { PhotoUpload, SingleFileUpload } from "@/components/photo-upload";
import { AIAssist } from "@/components/ai-assist";

interface ContratoOption {
  id: string;
  numero: string;
  empresaLocataria: string;
  status: string;
}

interface ManutencaoState {
  id?: string;
  contratoId: string;
  tipo: string;
  categoria: string;
  descricao: string;
  prestador: string;
  prestadorContato: string;
  prestadorCnpj: string;
  dataInicio: string;
  dataFim: string;
  valor: number;
  pagoPor: string;
  status: string;
  fotosAntes: string[];
  fotosDepois: string[];
  notaFiscalUrl: string;
  observacoes: string;
}

const CATEGORIAS = [
  { value: "ELETRICA", label: "Elétrica" },
  { value: "HIDRAULICA", label: "Hidráulica" },
  { value: "ESTRUTURAL", label: "Estrutural" },
  { value: "COBERTURA", label: "Cobertura" },
  { value: "PINTURA", label: "Pintura" },
  { value: "PORTAS_PORTOES", label: "Portas/Portões" },
  { value: "PISO", label: "Piso" },
  { value: "CLIMATIZACAO", label: "Climatização" },
  { value: "SEGURANCA", label: "Segurança" },
  { value: "LIMPEZA", label: "Limpeza" },
  { value: "OUTROS", label: "Outros" },
];

export function ManutencaoForm({
  galpaoId,
  mode,
  manutencao,
  contratos,
  canDelete = false,
}: {
  galpaoId: string;
  mode: "create" | "edit";
  manutencao?: ManutencaoState;
  contratos: ContratoOption[];
  canDelete?: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [fotosAntes, setFotosAntes] = useState<string[]>(
    manutencao?.fotosAntes ?? [],
  );
  const [fotosDepois, setFotosDepois] = useState<string[]>(
    manutencao?.fotosDepois ?? [],
  );
  const [notaFiscalUrl, setNotaFiscalUrl] = useState<string>(
    manutencao?.notaFiscalUrl ?? "",
  );
  const [aiFields, setAiFields] = useState<Partial<ManutencaoState>>({});
  const [formKey, setFormKey] = useState(0);

  function applyAIFields(filled: Record<string, unknown>) {
    setAiFields(filled as Partial<ManutencaoState>);
    setFormKey((k) => k + 1);
  }

  // Valor efetivo: AI > manutencao (edit) > vazio
  const v = (k: keyof ManutencaoState) =>
    (aiFields[k] as string | number | undefined) ??
    (manutencao?.[k] as string | number | undefined) ??
    "";

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const payload = Object.fromEntries(fd.entries()) as Record<string, unknown>;

    [
      "contratoId",
      "prestadorContato",
      "prestadorCnpj",
      "dataFim",
      "pagoPor",
      "observacoes",
    ].forEach((k) => {
      if (payload[k] === "" || payload[k] === null) delete payload[k];
    });

    // Sobrescreve com os valores controlados dos uploads
    payload.fotosAntes = fotosAntes;
    payload.fotosDepois = fotosDepois;
    if (notaFiscalUrl) payload.notaFiscalUrl = notaFiscalUrl;
    else delete payload.notaFiscalUrl;

    const url =
      mode === "create"
        ? `/api/galpoes/${galpaoId}/manutencoes`
        : `/api/galpoes/${galpaoId}/manutencoes/${manutencao!.id}`;
    const method = mode === "create" ? "POST" : "PATCH";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Erro ao salvar");
      return;
    }
    if (mode === "create") {
      router.push(`/galpoes/${galpaoId}/manutencoes`);
      router.refresh();
    } else {
      setSuccess("Alteracoes salvas");
      router.refresh();
    }
  }

  async function onDelete() {
    if (!manutencao?.id) return;
    if (!confirm("Excluir esta manutencao? Acao irreversivel.")) return;
    setError(null);
    setDeleting(true);
    const res = await fetch(
      `/api/galpoes/${galpaoId}/manutencoes/${manutencao.id}`,
      { method: "DELETE" },
    );
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Erro ao excluir");
      setDeleting(false);
      return;
    }
    router.push(`/galpoes/${galpaoId}/manutencoes`);
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          {mode === "create" ? "Registrar manutenção" : "Editar manutenção"}
        </CardTitle>
        <CardDescription>
          Quem fez, quando, quanto custou. Fotos antes/depois ajudam a
          comprovar com a locatária e em vistoria final.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {mode === "create" && (
          <div className="mb-4">
            <AIAssist
              schemaName="manutencao"
              placeholder='Ex: "Troca de telhas no canto NE realizada por Telhados SP Ltda CNPJ 12.345.678/0001-90 em 10/05/2026, R$ 8.500, manutencao corretiva, paga pelo locador"'
              helperText="Descreva o servico e a IA preenche os campos abaixo."
              onFill={applyAIFields}
              accent="purple"
            />
          </div>
        )}
        <form key={formKey} onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo</Label>
              <select
                id="tipo"
                name="tipo"
                required
                defaultValue={String(v("tipo")) || "CORRETIVA"}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="PREVENTIVA">Preventiva</option>
                <option value="CORRETIVA">Corretiva</option>
                <option value="EMERGENCIAL">Emergencial</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="categoria">Categoria</Label>
              <select
                id="categoria"
                name="categoria"
                required
                defaultValue={String(v("categoria")) || "ELETRICA"}
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
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                name="status"
                defaultValue={String(v("status")) || "AGENDADA"}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="AGENDADA">Agendada</option>
                <option value="EM_ANDAMENTO">Em andamento</option>
                <option value="CONCLUIDA">Concluida</option>
                <option value="CANCELADA">Cancelada</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descricao do servico</Label>
            <textarea
              id="descricao"
              name="descricao"
              required
              maxLength={2000}
              rows={3}
              defaultValue={String(v("descricao"))}
              placeholder="Ex: troca do motor do portao automatico, instalacao de 4 disjuntores novos"
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="prestador">Prestador (empresa/pessoa)</Label>
              <Input
                id="prestador"
                name="prestador"
                required
                maxLength={200}
                defaultValue={String(v("prestador"))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="prestadorContato">Contato (telefone/email)</Label>
              <Input
                id="prestadorContato"
                name="prestadorContato"
                maxLength={100}
                defaultValue={String(v("prestadorContato"))}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="prestadorCnpj">CNPJ/CPF do prestador</Label>
              <Input
                id="prestadorCnpj"
                name="prestadorCnpj"
                maxLength={30}
                defaultValue={String(v("prestadorCnpj"))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dataInicio">Data inicio</Label>
              <Input
                id="dataInicio"
                name="dataInicio"
                type="date"
                required
                defaultValue={String(v("dataInicio"))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dataFim">Data fim (se concluida)</Label>
              <Input
                id="dataFim"
                name="dataFim"
                type="date"
                defaultValue={String(v("dataFim"))}
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
                min="0"
                required
                defaultValue={String(v("valor"))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pagoPor">Pago por</Label>
              <select
                id="pagoPor"
                name="pagoPor"
                defaultValue={String(v("pagoPor"))}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">— Selecione —</option>
                <option value="LOCADOR">Locador (eu)</option>
                <option value="LOCATARIA">Locataria</option>
                <option value="COMPARTILHADO">Compartilhado</option>
              </select>
            </div>
          </div>

          {contratos.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="contratoId">Contrato vinculado (opcional)</Label>
              <select
                id="contratoId"
                name="contratoId"
                defaultValue={manutencao?.contratoId ?? ""}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">— Manutencao no galpao vago —</option>
                {contratos.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.numero} — {c.empresaLocataria} ({c.status})
                  </option>
                ))}
              </select>
              <p className="text-xs text-slate-500">
                Util pra prestar contas com a locataria depois.
              </p>
            </div>
          )}

          <div className="rounded-md border border-blue-200 bg-blue-50/40 p-3 space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-blue-900">
              <ImageIcon className="h-4 w-4" />
              Fotos comprobatorias
            </div>
            <p className="text-xs text-blue-800">
              Tire fotos no celular ou faça upload do PC. Maximo 10MB por
              arquivo, 10 arquivos por etapa.
            </p>

            <div className="grid gap-4 md:grid-cols-2">
              <PhotoUpload
                folder="manutencoes"
                urls={fotosAntes}
                onChange={setFotosAntes}
                label="Fotos ANTES"
                maxFiles={10}
              />
              <PhotoUpload
                folder="manutencoes"
                urls={fotosDepois}
                onChange={setFotosDepois}
                label="Fotos DEPOIS"
                maxFiles={10}
              />
            </div>
          </div>

          <SingleFileUpload
            folder="manutencoes"
            url={notaFiscalUrl}
            onChange={setNotaFiscalUrl}
            label="Nota Fiscal / orcamento (PDF, opcional)"
            accept="application/pdf,image/*"
          />

          <div className="space-y-2">
            <Label htmlFor="observacoes">Observacoes</Label>
            <textarea
              id="observacoes"
              name="observacoes"
              rows={2}
              maxLength={2000}
              defaultValue={manutencao?.observacoes ?? ""}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
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
                {loading
                  ? "Salvando..."
                  : mode === "create"
                    ? "Registrar"
                    : "Salvar alteracoes"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(`/galpoes/${galpaoId}/manutencoes`)}
              >
                {mode === "create" ? "Cancelar" : "Voltar"}
              </Button>
            </div>
            {mode === "edit" && canDelete && (
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
