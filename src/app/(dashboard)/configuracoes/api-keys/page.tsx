import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/tenant";
import { getPlanLimits, nextPlan } from "@/lib/plan-limits";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { KeyRound, Lock } from "lucide-react";
import { ApiKeysClient } from "./client";

export default async function ApiKeysPage() {
  const ctx = await requireAuth();
  const { plan, limits } = await getPlanLimits(ctx.tenantId);

  if (!limits.apiAccess) {
    const np = nextPlan(plan);
    return (
      <div className="mx-auto max-w-2xl space-y-6 py-8">
        <h1 className="flex items-center gap-2 text-3xl font-bold">
          <KeyRound className="h-7 w-7 text-primary" />
          API Keys
        </h1>
        <Card className="border-amber-300 bg-amber-50/30">
          <CardContent className="space-y-4 py-10 text-center">
            <Lock className="mx-auto h-12 w-12 text-amber-600" />
            <h2 className="text-xl font-bold text-amber-900">
              API disponível no plano Business
            </h2>
            <p className="mx-auto max-w-md text-sm text-amber-800">
              Conecte seu ERP (TOTVS, SAP, Bling, Conta Azul) ao SaaS Galpão.
              Endpoints REST autenticados por API Key permitem:
            </p>
            <ul className="mx-auto max-w-md space-y-1 text-left text-sm text-amber-900">
              <li>• Importar/exportar galpões e contratos automaticamente</li>
              <li>• Marcar receitas como pagas quando o ERP recebe Pix</li>
              <li>• Consultar alertas pendentes do seu sistema externo</li>
              <li>• Sincronizar dados sem digitação dupla</li>
            </ul>
            <p className="text-xs text-amber-700">
              Plano atual: <strong>{plan}</strong>
            </p>
            <Button asChild>
              <Link href="/configuracoes/plano">Upgrade pra {np ?? "Business"}</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (ctx.role !== "ADMIN") {
    return (
      <div className="mx-auto max-w-2xl py-12 text-center">
        <p className="text-sm text-slate-600">
          Apenas administradores podem gerenciar API Keys.
        </p>
      </div>
    );
  }

  const keys = await prisma.apiKey.findMany({
    where: { tenantId: ctx.tenantId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      keyPrefix: true,
      lastUsedAt: true,
      expiresAt: true,
      revokedAt: true,
      createdAt: true,
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-3xl font-bold">
          <KeyRound className="h-7 w-7 text-primary" />
          API Keys
        </h1>
        <p className="text-sm text-slate-500">
          Conecte seu ERP. Documentação:{" "}
          <Link href="/configuracoes/api-keys/docs" className="text-primary hover:underline">
            ver endpoints disponíveis
          </Link>
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">URL base</CardTitle>
          <CardDescription>
            Use essa URL como base pra todas as chamadas. Autenticação por
            header <code>Authorization: Bearer &lt;chave&gt;</code>.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <code className="block rounded-md bg-slate-900 px-3 py-2 font-mono text-xs text-slate-100">
            {process.env.NEXTAUTH_URL ?? "https://saas-galpao.vercel.app"}/api/v1
          </code>
        </CardContent>
      </Card>

      <ApiKeysClient
        initialKeys={keys.map((k) => ({
          id: k.id,
          name: k.name,
          keyPrefix: k.keyPrefix,
          lastUsedAt: k.lastUsedAt?.toISOString() ?? null,
          expiresAt: k.expiresAt?.toISOString() ?? null,
          revokedAt: k.revokedAt?.toISOString() ?? null,
          createdAt: k.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
