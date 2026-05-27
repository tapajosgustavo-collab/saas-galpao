"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, Lock, Unlock } from "lucide-react";
import { PhotoUpload, SingleFileUpload } from "@/components/photo-upload";
import { AIAssist } from "@/components/ai-assist";

const AREAS = [
  { value: "ESTRUTURA", label: "Estrutura" },
  { value: "COBERTURA", label: "Cobertura" },
  { value: "PISO", label: "Piso" },
  { value: "PAREDES", label: "Paredes" },
  { value: "PORTAS_PORTOES", label: "Portas/Portões" },
  { value: "ELETRICA", label: "Elétrica" },
  { value: "HIDRAULICA", label: "Hidráulica" },
  { value: "ILUMINACAO", label: "Iluminação" },
  { value: "CLIMATIZACAO", label: "Climatização" },
  { value: "EXTERNO_PATIO", label: "Externo/Pátio" },
  { value: "SEGURANCA", label: "Segurança" },
  { value: "OUTROS", label: "Outros" },
];

const CONDICOES = [
  { value: "BOM", label: "Bom" },
  { value: "REGULAR", label: "Regular" },
  { value: "RUIM", label: "Ruim" },
  { value: "CRITICO", label: "Crítico" },
  { value: "NAO_APLICA", label: "Não se aplica" },
];

interface ItemState {
  area: string;
  descricao: string;
  condicao: string;
  observacao: string;
  fotos: string[];
}

interface VistoriaState {
  id: string;
  dataVistoria: string;
  responsavelInterno: string;
  responsavelLocataria: string;
  cpfLocataria: string;
  observacoesGerais: string;
  fotosGerais: string[];
  status: string;
  documentoUrl: string;
  itens: ItemState[];
}

const TEMPLATE_ITENS: ItemState[] = AREAS.map((a) => ({
  area: a.value,
  descricao: "",
  condicao: "BOM",
  observacao: "",
  fotos: [],
}));

export function VistoriaForm({
  contratoId,
  tipo,
  vistoria,
  canDelete,
}: {
  contratoId: string;
  tipo: "INICIAL" | "FINAL";
  vistoria?: VistoriaState;
  canDelete: boolean;
}) {
  const router = useRouter();
  const mode = vistoria ? "edit" : "create";
  const isFinalizada = vistoria?.status === "FINALIZADA";

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [itens, setItens] = useState<ItemState[]>(
    vistoria?.itens && vistoria.itens.length > 0 ? vistoria.itens : TEMPLATE_ITENS,
  );
  const [fotosGerais, setFotosGerais] = useState<string[]>(
    vistoria?.fotosGerais ?? [],
  );
  const [documentoUrl, setDocumentoUrl] = useState<string>(
    vistoria?.documentoUrl ?? "",
  );
  const [observacoesGeraisIA, setObservacoesGeraisIA] = useState<string>("");
  const [formKey, setFormKey] = useState(0);

  function applyAIFields(filled: Record<string, unknown>) {
    const obs = filled.observacoesGerais;
    if (typeof obs === "string") setObservacoesGeraisIA(obs);

    const aiItens = filled.itens;
    if (Array.isArray(aiItens)) {
      // Merge: pra cada item da AI, atualiza o item existente na mesma area
      // (ou cria novo se area nao existe no template).
      setItens((current) => {
        const next = [...current];
        for (const ai of aiItens as Array<{ area: string; condicao: string; observacao?: string }>) {
          const idx = next.findIndex((it) => it.area === ai.area);
          if (idx >= 0) {
            next[idx] = {
              ...next[idx]!,
              condicao: ai.condicao || next[idx]!.condicao,
              observacao: ai.observacao || next[idx]!.observacao,
            };
          } else {
            next.push({
              area: ai.area,
              descricao: "",
              condicao: ai.condicao || "BOM",
              observacao: ai.observacao || "",
              fotos: [],
            });
          }
        }
        return next;
      });
    }
    setFormKey((k) => k + 1);
  }

  function setItemField<K extends keyof ItemState>(
    index: number,
    field: K,
    value: ItemState[K],
  ) {
    setItens((arr) =>
      arr.map((it, i) => (i === index ? { ...it, [field]: value } : it)),
    );
  }

  function addItem() {
    setItens((arr) => [
      ...arr,
      { area: "OUTROS", descricao: "", condicao: "BOM", observacao: "", fotos: [] },
    ]);
  }

  function removeItem(index: number) {
    setItens((arr) => arr.filter((_, i) => i !== index));
  }

  async function onSubmit(
    e: React.FormEvent<HTMLFormElement>,
    finalize = false,
  ) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    const fd = new FormData(e.currentTarget);

    const payload = {
      tipo,
      dataVistoria: fd.get("dataVistoria"),
      responsavelInterno: fd.get("responsavelInterno") || undefined,
      responsavelLocataria: fd.get("responsavelLocataria") || undefined,
      cpfLocataria: fd.get("cpfLocataria") || undefined,
      observacoesGerais: fd.get("observacoesGerais") || undefined,
      fotosGerais,
      documentoUrl: documentoUrl || undefined,
      status: finalize ? "FINALIZADA" : (fd.get("status") ?? "RASCUNHO"),
      itens: itens.map((it, idx) => ({
        ...it,
        ordem: idx,
        descricao: it.descricao || undefined,
        observacao: it.observacao || undefined,
      })),
    };

    const url =
      mode === "create"
        ? `/api/contratos/${contratoId}/vistorias`
        : `/api/contratos/${contratoId}/vistorias/${vistoria!.id}`;
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
      router.push(`/contratos/${contratoId}/vistoria`);
      router.refresh();
    } else {
      setSuccess(finalize ? "Vistoria finalizada" : "Alteracoes salvas");
      router.refresh();
    }
  }

  async function reabrir() {
    if (!vistoria?.id) return;
    setError(null);
    const res = await fetch(
      `/api/contratos/${contratoId}/vistorias/${vistoria.id}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "RASCUNHO" }),
      },
    );
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Erro ao reabrir");
      return;
    }
    router.refresh();
  }

  async function onDelete() {
    if (!vistoria?.id) return;
    if (!confirm("Excluir esta vistoria? Acao irreversivel.")) return;
    setError(null);
    setDeleting(true);
    const res = await fetch(
      `/api/contratos/${contratoId}/vistorias/${vistoria.id}`,
      { method: "DELETE" },
    );
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Erro ao excluir");
      setDeleting(false);
      return;
    }
    router.push(`/contratos/${contratoId}/vistoria`);
    router.refresh();
  }

  return (
    <form key={formKey} onSubmit={(e) => onSubmit(e, false)} className="space-y-6">
      {/* IA Assist - so quando esta criando ou rascunho */}
      {!isFinalizada && mode === "create" && (
        <AIAssist
          schemaName="vistoria"
          placeholder='Ex: "Galpao em bom estado geral. Telhado com 2 telhas trincadas no canto NE (RUIM). Piso bom, paredes regulares com manchas. Eletrica e hidraulica BOM. Portao automatico funcionando."'
          helperText="Descreva o estado do galpao e a IA preenche as condicoes de cada area do checklist."
          onFill={applyAIFields}
          accent="purple"
        />
      )}
      {/* Header card com dados gerais */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            Dados gerais
            {isFinalizada && (
              <Badge variant="success">
                <Lock className="mr-1 h-3 w-3" /> Finalizada
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            {tipo === "INICIAL"
              ? "Condições do galpão na entrega à locatária."
              : "Condições do galpão na devolução pela locatária."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <fieldset disabled={isFinalizada} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dataVistoria">Data da vistoria</Label>
                <Input
                  id="dataVistoria"
                  name="dataVistoria"
                  type="date"
                  required
                  defaultValue={vistoria?.dataVistoria ?? ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="responsavelInterno">Responsavel interno (quem vistoriou)</Label>
                <Input
                  id="responsavelInterno"
                  name="responsavelInterno"
                  maxLength={200}
                  defaultValue={vistoria?.responsavelInterno ?? ""}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="responsavelLocataria">
                  Responsavel locataria (quem assinou)
                </Label>
                <Input
                  id="responsavelLocataria"
                  name="responsavelLocataria"
                  maxLength={200}
                  defaultValue={vistoria?.responsavelLocataria ?? ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cpfLocataria">CPF do responsavel</Label>
                <Input
                  id="cpfLocataria"
                  name="cpfLocataria"
                  maxLength={20}
                  defaultValue={vistoria?.cpfLocataria ?? ""}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="observacoesGerais">Observacoes gerais</Label>
              <textarea
                id="observacoesGerais"
                name="observacoesGerais"
                rows={3}
                maxLength={2000}
                defaultValue={observacoesGeraisIA || vistoria?.observacoesGerais || ""}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>

            <PhotoUpload
              folder="vistorias"
              urls={fotosGerais}
              onChange={setFotosGerais}
              label="Fotos gerais do laudo"
              maxFiles={15}
            />

            <SingleFileUpload
              folder="vistorias"
              url={documentoUrl}
              onChange={setDocumentoUrl}
              label="PDF do laudo assinado (opcional)"
              accept="application/pdf"
            />

            <input type="hidden" name="status" value={vistoria?.status ?? "RASCUNHO"} />
          </fieldset>
        </CardContent>
      </Card>

      {/* Itens de checklist */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Checklist por área</CardTitle>
              <CardDescription>
                {itens.length} item(s). Avalie a condição de cada área.
              </CardDescription>
            </div>
            {!isFinalizada && (
              <Button type="button" variant="outline" size="sm" onClick={addItem}>
                <Plus className="h-4 w-4" /> Adicionar item
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <fieldset disabled={isFinalizada} className="space-y-4">
            {itens.map((item, idx) => (
              <div
                key={idx}
                className="rounded-md border bg-slate-50/40 p-3 space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="grid flex-1 grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Área</Label>
                      <select
                        value={item.area}
                        onChange={(e) => setItemField(idx, "area", e.target.value)}
                        className="flex h-9 w-full rounded-md border border-input bg-background px-2 py-1 text-xs"
                      >
                        {AREAS.map((a) => (
                          <option key={a.value} value={a.value}>
                            {a.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Condição</Label>
                      <select
                        value={item.condicao}
                        onChange={(e) =>
                          setItemField(idx, "condicao", e.target.value)
                        }
                        className="flex h-9 w-full rounded-md border border-input bg-background px-2 py-1 text-xs"
                      >
                        {CONDICOES.map((c) => (
                          <option key={c.value} value={c.value}>
                            {c.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Descrição</Label>
                      <Input
                        value={item.descricao}
                        onChange={(e) =>
                          setItemField(idx, "descricao", e.target.value)
                        }
                        placeholder="Ex: Telhado Eternit"
                        className="h-9 text-xs"
                      />
                    </div>
                  </div>
                  {!isFinalizada && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItem(idx)}
                      className="text-red-600"
                      title="Remover item"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Observação</Label>
                  <Input
                    value={item.observacao}
                    onChange={(e) =>
                      setItemField(idx, "observacao", e.target.value)
                    }
                    placeholder="Ex: 2 telhas trincadas no canto NE"
                    className="h-9 text-xs"
                  />
                </div>

                <PhotoUpload
                  folder="vistorias"
                  urls={item.fotos}
                  onChange={(novas) => setItemField(idx, "fotos", novas)}
                  maxFiles={6}
                  compact
                />
              </div>
            ))}
          </fieldset>
        </CardContent>
      </Card>

      {error && (
        <p className="rounded-md bg-red-50 p-2 text-sm text-red-700">{error}</p>
      )}
      {success && (
        <p className="rounded-md bg-green-50 p-2 text-sm text-green-700">
          {success}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          {!isFinalizada && (
            <>
              <Button type="submit" disabled={loading}>
                {loading
                  ? "Salvando..."
                  : mode === "create"
                    ? "Salvar rascunho"
                    : "Salvar alteracoes"}
              </Button>
              <Button
                type="button"
                disabled={loading}
                onClick={(e) =>
                  onSubmit(
                    {
                      ...e,
                      currentTarget: (e.currentTarget as HTMLButtonElement).form!,
                      preventDefault: () => {},
                    } as unknown as React.FormEvent<HTMLFormElement>,
                    true,
                  )
                }
                className="bg-green-600 hover:bg-green-700"
              >
                <Lock className="h-4 w-4" /> Finalizar laudo
              </Button>
            </>
          )}
          {isFinalizada && (
            <Button type="button" variant="outline" onClick={reabrir}>
              <Unlock className="h-4 w-4" /> Reabrir para edição
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/contratos/${contratoId}/vistoria`)}
          >
            Voltar
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
  );
}
