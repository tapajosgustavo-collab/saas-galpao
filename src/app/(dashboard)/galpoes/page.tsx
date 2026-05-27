import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/tenant";
import { checkGalpaoSlot, formatLimit, nextPlan } from "@/lib/plan-limits";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExportButton } from "@/components/export-button";
import { formatBRL } from "@/lib/utils";
import { Plus, MapPin, Lock } from "lucide-react";

const statusColor: Record<string, "success" | "warning" | "secondary" | "destructive"> = {
  DISPONIVEL: "success",
  OCUPADO: "secondary",
  EM_NEGOCIACAO: "warning",
  MANUTENCAO: "destructive",
};

export default async function GalpoesPage() {
  const ctx = await requireAuth();
  const [galpoes, slot] = await Promise.all([
    prisma.galpao.findMany({
      where: { tenantId: ctx.tenantId },
      orderBy: { createdAt: "desc" },
    }),
    checkGalpaoSlot(ctx.tenantId),
  ]);

  const limitMax = formatLimit(slot.max);
  const np = nextPlan(slot.plan);
  const restantes = Number.isFinite(slot.max) ? slot.max - slot.current : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Galpões</h1>
          <p className="text-sm text-slate-500">
            {slot.current} de {limitMax} galpões — plano{" "}
            <strong>{slot.plan}</strong>
            {restantes !== null && restantes <= 2 && restantes > 0 && (
              <span className="ml-2 rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                restam {restantes}
              </span>
            )}
            {!slot.allowed && (
              <span className="ml-2 rounded bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                limite atingido
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          {galpoes.length > 0 && <ExportButton type="galpoes" />}
          {slot.allowed ? (
            <Button asChild>
              <Link href="/galpoes/novo">
                <Plus className="h-4 w-4" /> Novo galpão
              </Link>
            </Button>
          ) : (
            <Button asChild variant="outline" className="border-amber-300 text-amber-700">
              <Link href="/configuracoes/plano">
                <Lock className="h-4 w-4" />
                Upgrade pra {np ?? "Enterprise"}
              </Link>
            </Button>
          )}
        </div>
      </div>

      {!slot.allowed && (
        <Card className="border-amber-300 bg-amber-50">
          <CardContent className="flex items-center justify-between py-3 text-sm">
            <p className="text-amber-900">
              <Lock className="mr-1 inline h-4 w-4" />
              Você atingiu o limite de <strong>{slot.max} galpões</strong> do plano{" "}
              {slot.plan}.{" "}
              {np && <>Faça upgrade pra <strong>{np}</strong> pra continuar cadastrando.</>}
            </p>
            <Button asChild size="sm">
              <Link href="/configuracoes/plano">Ver planos</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {galpoes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-slate-500">
            Nenhum galpão cadastrado ainda.{" "}
            <Link href="/galpoes/novo" className="text-primary hover:underline">
              Criar o primeiro
            </Link>
            .
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {galpoes.map((g) => (
            <Link
              key={g.id}
              href={`/galpoes/${g.id}`}
              className="block focus:outline-none focus:ring-2 focus:ring-ring rounded-lg"
            >
              <Card className="h-full cursor-pointer transition-shadow hover:shadow-md">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-base">{g.nome}</CardTitle>
                    <Badge variant={statusColor[g.status] ?? "secondary"}>
                      {g.status.replace("_", " ")}
                    </Badge>
                  </div>
                  <p className="flex items-center gap-1 text-xs text-slate-500">
                    <MapPin className="h-3 w-3" />
                    {g.cidade}/{g.estado}
                  </p>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Tipo</span>
                    <span className="font-medium">{g.tipo}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Total</span>
                    <span className="font-medium">
                      {Number(g.metragemTotal).toLocaleString("pt-BR")} m²
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Disponível</span>
                    <span className="font-medium">
                      {Number(g.metragemDisponivel).toLocaleString("pt-BR")} m²
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Valor/m²</span>
                    <span className="font-medium">{formatBRL(Number(g.valorPorM2))}</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
