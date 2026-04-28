import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/tenant";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatBRL } from "@/lib/utils";
import { Plus, MapPin } from "lucide-react";

const statusColor: Record<string, "success" | "warning" | "secondary" | "destructive"> = {
  DISPONIVEL: "success",
  OCUPADO: "secondary",
  EM_NEGOCIACAO: "warning",
  MANUTENCAO: "destructive",
};

export default async function GalpoesPage() {
  const ctx = await requireAuth();
  const galpoes = await prisma.galpao.findMany({
    where: { tenantId: ctx.tenantId },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Galpões</h1>
          <p className="text-sm text-slate-500">
            {galpoes.length} galpão{galpoes.length !== 1 && "ões"} cadastrado
            {galpoes.length !== 1 && "s"}
          </p>
        </div>
        <Button asChild>
          <Link href="/galpoes/novo">
            <Plus className="h-4 w-4" /> Novo galpão
          </Link>
        </Button>
      </div>

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
            <Card key={g.id} className="transition-shadow hover:shadow-md">
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
                  <span className="font-medium">{Number(g.metragemTotal).toLocaleString("pt-BR")} m²</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Disponível</span>
                  <span className="font-medium">{Number(g.metragemDisponivel).toLocaleString("pt-BR")} m²</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Valor/m²</span>
                  <span className="font-medium">{formatBRL(Number(g.valorPorM2))}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
