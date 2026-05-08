import { requireAuth } from "@/lib/tenant";
import {
  evaluateAccess,
  getOrCreateSubscription,
  PLAN_INFO,
} from "@/lib/subscription";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Check, AlertTriangle, Sparkles } from "lucide-react";
import { formatDate } from "@/lib/utils";

const STATUS_LABEL: Record<string, string> = {
  TRIALING: "Período de avaliação",
  ACTIVE: "Ativa",
  PAST_DUE: "Pagamento em atraso",
  CANCELED: "Cancelada",
};

const STATUS_VARIANT: Record<string, "success" | "warning" | "destructive" | "secondary"> = {
  TRIALING: "warning",
  ACTIVE: "success",
  PAST_DUE: "destructive",
  CANCELED: "secondary",
};

export default async function ConfigPlanoPage() {
  const ctx = await requireAuth();
  const sub = await getOrCreateSubscription(ctx.tenantId);
  const access = evaluateAccess(sub);
  const tenant = await prisma.tenant.findUnique({
    where: { id: ctx.tenantId },
    select: { name: true },
  });

  const planInfo = PLAN_INFO[sub.plan];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-3xl font-bold">
          <CreditCard className="h-7 w-7 text-primary" />
          Plano e Assinatura
        </h1>
        <p className="text-sm text-slate-500">
          Empresa: <strong>{tenant?.name}</strong>
        </p>
      </div>

      {/* Status atual */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Plano atual</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold">{planInfo.label}</p>
              <p className="text-sm text-slate-500">
                {planInfo.preco}/mês
              </p>
            </div>
            <Badge variant={STATUS_VARIANT[sub.status] ?? "secondary"}>
              {STATUS_LABEL[sub.status] ?? sub.status}
            </Badge>
          </div>

          {sub.status === "TRIALING" && access.hasAccess && (
            <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              <Sparkles className="mb-1 h-4 w-4" />
              <p>
                Você está no período de avaliação gratuita. Acaba em{" "}
                <strong>{formatDate(sub.trialEndsAt)}</strong> ({access.daysLeftInTrial}{" "}
                dia{access.daysLeftInTrial === 1 ? "" : "s"}).
              </p>
            </div>
          )}

          {!access.hasAccess && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-900">
              <AlertTriangle className="mb-1 h-4 w-4" />
              <p>
                <strong>Acesso bloqueado.</strong>{" "}
                {access.reason === "trial-expired"
                  ? "Seu período gratuito acabou."
                  : access.reason === "past-due"
                    ? "Pagamento em atraso."
                    : "Assinatura cancelada."}{" "}
                Pra continuar, escolha um plano abaixo e faça a primeira cobrança.
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 border-t pt-3 text-sm">
            <div>
              <p className="text-slate-500">Trial termina em</p>
              <p className="font-medium">{formatDate(sub.trialEndsAt)}</p>
            </div>
            <div>
              <p className="text-slate-500">Próxima cobrança em</p>
              <p className="font-medium">{formatDate(sub.currentPeriodEnd)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Como assinar */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Como assinar</CardTitle>
          <CardDescription>
            Por enquanto a cobrança é manual via Pix. Logo será automática.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <ol className="list-decimal space-y-2 pl-5">
            <li>
              Escolha um dos planos abaixo (você pode mudar depois).
            </li>
            <li>
              Mande um email pra{" "}
              <a
                href="mailto:contato@saasgalpao.com.br"
                className="text-primary hover:underline"
              >
                contato@saasgalpao.com.br
              </a>{" "}
              com o nome da empresa, plano escolhido e CNPJ pra emissão da nota.
            </li>
            <li>
              Você recebe um Pix QR Code do valor mensal.
            </li>
            <li>
              Após confirmação do pagamento (mesmo dia), sua conta é ativada.
            </li>
          </ol>
        </CardContent>
      </Card>

      {/* Tabela de planos */}
      <div className="grid gap-4 md:grid-cols-3">
        {(["STARTER", "PRO", "BUSINESS"] as const).map((p) => {
          const info = PLAN_INFO[p];
          const atual = sub.plan === p;
          const destacado = p === "PRO";
          return (
            <Card
              key={p}
              className={
                atual
                  ? "border-2 border-green-500"
                  : destacado
                    ? "border-2 border-primary"
                    : ""
              }
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{info.label}</CardTitle>
                  {atual && (
                    <Badge variant="success">
                      <Check className="mr-1 h-3 w-3" />
                      Plano atual
                    </Badge>
                  )}
                  {!atual && destacado && (
                    <Badge>
                      <Sparkles className="mr-1 h-3 w-3" />
                      Recomendado
                    </Badge>
                  )}
                </div>
                <p className="mt-1 text-2xl font-bold">
                  {info.preco}
                  <span className="text-sm font-normal text-slate-500">/mês</span>
                </p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-xs">
                  {info.recursos.map((r) => (
                    <li key={r} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-3 w-3 shrink-0 text-green-600" />
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
