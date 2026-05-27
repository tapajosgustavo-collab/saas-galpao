"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2 } from "lucide-react";
import { SingleFileUpload } from "@/components/photo-upload";
import { AIAssist } from "@/components/ai-assist";
import { PdfExtract } from "@/components/pdf-extract";

const TIPOS = [
  { value: "AVCB", label: "AVCB — Bombeiros", freqDefault: 24 },
  { value: "LICENCA_AMBIENTAL", label: "Licença Ambiental", freqDefault: 12 },
  { value: "ALVARA_FUNCIONAMENTO", label: "Alvará de Funcionamento", freqDefault: 12 },
  { value: "IPTU", label: "IPTU", freqDefault: 12 },
  { value: "LAUDO_TECNICO", label: "Laudo Técnico", freqDefault: 12 },
  { value: "ANALISE_POTABILIDADE", label: "Análise de Potabilidade", freqDefault: 6 },
  { value: "PGRS", label: "PGRS (Plano Resíduos)", freqDefault: 12 },
  { value: "OUTROS", label: "Outros", freqDefault: null },
];

interface DocumentoState {
  id?: string;
  tipo: string;
  nome: string;
  numero: string;
  emissor: string;
  dataEmissao: string;
  dataValidade: string;
  frequenciaRenovacaoMeses: string;
  alertarDiasAntes: number;
  status: string;
  responsavelPagamento: string;
  documentoUrl: string;
  observacoes: string;
}

export function DocumentoForm({
  galpaoId,
  mode,
  documento,
  canDelete = false,
}: {
  galpaoId: string;
  mode: "create" | "edit";
  documento?: DocumentoState;
  canDelete?: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [tipo, setTipo] = useState(documento?.tipo ?? "AVCB");
  const [documentoUrl, setDocumentoUrl] = useState<string>(
    documento?.documentoUrl ?? "",
  );
  const [aiFields, setAiFields] = useState<Partial<DocumentoState>>({});
  const [formKey, setFormKey] = useState(0);

  function applyAIFields(filled: Record<string, unknown>) {
    const f = filled as Partial<DocumentoState>;
    setAiFields(f);
    if (f.tipo) setTipo(f.tipo);
    setFormKey((k) => k + 1);
  }

  const v = (k: keyof DocumentoState) =>
    (aiFields[k] as string | undefined) ??
    (documento?.[k] as string | undefined) ??
    "";

  const tipoMeta = TIPOS.find((t) => t.value === tipo);
  const isIPTU = tipo === "IPTU";

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const payload = Object.fromEntries(fd.entries()) as Record<string, unknown>;

    // Limpa campos vazios opcionais para nao quebrar o coerce do Zod
    [
      "numero",
      "emissor",
      "dataEmissao",
      "frequenciaRenovacaoMeses",
      "responsavelPagamento",
      "observacoes",
    ].forEach((k) => {
      if (payload[k] === "" || payload[k] === null) delete payload[k];
    });

    if (documentoUrl) payload.documentoUrl = documentoUrl;
    else delete payload.documentoUrl;

    const url =
      mode === "create"
        ? `/api/galpoes/${galpaoId}/documentos`
        : `/api/galpoes/${galpaoId}/documentos/${documento!.id}`;
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
      router.push(`/galpoes/${galpaoId}/documentos`);
      router.refresh();
    } else {
      setSuccess("Alteracoes salvas");
      router.refresh();
    }
  }

  async function onDelete() {
    if (!documento?.id) return;
    if (!confirm(`Excluir "${documento.nome}"? Acao irreversivel.`)) return;
    setError(null);
    setDeleting(true);
    const res = await fetch(
      `/api/galpoes/${galpaoId}/documentos/${documento.id}`,
      { method: "DELETE" },
    );
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Erro ao excluir");
      setDeleting(false);
      return;
    }
    router.push(`/galpoes/${galpaoId}/documentos`);
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          {mode === "create" ? "Cadastrar documento" : "Editar documento"}
        </CardTitle>
        <CardDescription>
          AVCB, IPTU, licenças, laudos — qualquer documento que precisa
          renovar. O sistema alerta antes do vencimento.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {mode === "create" && (
          <div className="mb-4 space-y-3">
            <PdfExtract
              schemaName="documento"
              onExtracted={applyAIFields}
              helperText="Faça upload do PDF do AVCB, IPTU, licença ou alvará. A IA extrai protocolo, emissor, datas e tipo automaticamente."
              buttonLabel="Anexar PDF do documento"
              accent="blue"
            />
            <div className="text-center text-xs text-slate-400">— OU —</div>
            <AIAssist
              schemaName="documento"
              placeholder='Ex: "AVCB Cajamar protocolo 2024-12345 emitido pelo CBPMSP em 15/03/2024, validade ate 15/03/2026, renovar a cada 24 meses, avisar 60 dias antes"'
              helperText="Descreva o documento em texto livre."
              onFill={applyAIFields}
              accent="purple"
            />
          </div>
        )}
        <form key={formKey} onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo</Label>
              <select
                id="tipo"
                name="tipo"
                required
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {TIPOS.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                name="status"
                defaultValue={String(v("status")) || "VIGENTE"}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="VIGENTE">Vigente</option>
                <option value="PROXIMO_VENCIMENTO">Próximo do vencimento</option>
                <option value="VENCIDO">Vencido</option>
                <option value="EM_RENOVACAO">Em renovação</option>
                <option value="NAO_APLICA">Não se aplica</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="nome">Nome / descricao</Label>
            <Input
              id="nome"
              name="nome"
              required
              maxLength={200}
              placeholder="Ex: AVCB 2024-2026"
              defaultValue={String(v("nome"))}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="numero">Numero / protocolo (opcional)</Label>
              <Input
                id="numero"
                name="numero"
                maxLength={100}
                defaultValue={String(v("numero"))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emissor">Orgao emissor (opcional)</Label>
              <Input
                id="emissor"
                name="emissor"
                maxLength={200}
                placeholder="Ex: CBPMSP"
                defaultValue={String(v("emissor"))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dataEmissao">Data de emissao (opcional)</Label>
              <Input
                id="dataEmissao"
                name="dataEmissao"
                type="date"
                defaultValue={String(v("dataEmissao"))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dataValidade">Data de validade</Label>
              <Input
                id="dataValidade"
                name="dataValidade"
                type="date"
                required
                defaultValue={String(v("dataValidade"))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="frequenciaRenovacaoMeses">
                Frequencia de renovacao (meses)
              </Label>
              <Input
                id="frequenciaRenovacaoMeses"
                name="frequenciaRenovacaoMeses"
                type="number"
                min="1"
                max="120"
                placeholder={
                  tipoMeta?.freqDefault
                    ? `Sugerido: ${tipoMeta.freqDefault}`
                    : "Ex: 12"
                }
                defaultValue={String(v("frequenciaRenovacaoMeses"))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="alertarDiasAntes">Alertar quantos dias antes</Label>
              <Input
                id="alertarDiasAntes"
                name="alertarDiasAntes"
                type="number"
                min="1"
                max="365"
                defaultValue={String(v("alertarDiasAntes")) || "60"}
                required
              />
            </div>
          </div>

          {isIPTU && (
            <div className="rounded-md border border-amber-200 bg-amber-50 p-3 space-y-2">
              <Label htmlFor="responsavelPagamento" className="text-amber-900">
                Quem paga o IPTU?
              </Label>
              <p className="text-xs text-amber-800">
                IPTU costuma estar em nome do locador mas ser pago pela
                locatária. Se ela atrasar, voce fica com certidão negativa
                bloqueada.
              </p>
              <select
                id="responsavelPagamento"
                name="responsavelPagamento"
                defaultValue={String(v("responsavelPagamento"))}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">— Selecione —</option>
                <option value="LOCATARIA">Locatária</option>
                <option value="LOCADOR">Locador (eu)</option>
                <option value="COMPARTILHADO">Compartilhado</option>
              </select>
            </div>
          )}

          <SingleFileUpload
            folder="documentos"
            url={documentoUrl}
            onChange={setDocumentoUrl}
            label="Anexar documento (PDF/imagem, opcional)"
            accept="application/pdf,image/*"
          />

          <div className="space-y-2">
            <Label htmlFor="observacoes">Observacoes</Label>
            <Input
              id="observacoes"
              name="observacoes"
              maxLength={2000}
              defaultValue={documento?.observacoes ?? ""}
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
                    ? "Cadastrar"
                    : "Salvar alteracoes"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(`/galpoes/${galpaoId}/documentos`)}
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
