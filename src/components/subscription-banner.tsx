import Link from "next/link";
import { AlertCircle, Sparkles, AlertTriangle } from "lucide-react";
import type { AccessInfo } from "@/lib/subscription";

export function SubscriptionBanner({ info }: { info: AccessInfo }) {
  const { reason, daysLeftInTrial } = info;

  if (reason === "active") return null;

  if (reason === "trial-active") {
    if (daysLeftInTrial > 5) return null;
    const cor =
      daysLeftInTrial <= 2
        ? "border-red-300 bg-red-50 text-red-900"
        : "border-amber-300 bg-amber-50 text-amber-900";
    return (
      <div className={`flex items-center gap-3 border-b px-8 py-3 text-sm ${cor}`}>
        <Sparkles className="h-4 w-4 shrink-0" />
        <p className="flex-1">
          Você tem mais{" "}
          <strong>
            {daysLeftInTrial} dia{daysLeftInTrial === 1 ? "" : "s"}
          </strong>{" "}
          de período gratuito. Depois disso será necessário assinar pra continuar.
        </p>
        <Link
          href="/configuracoes/plano"
          className="rounded-md bg-white px-3 py-1 text-xs font-medium hover:bg-slate-50"
        >
          Ver planos
        </Link>
      </div>
    );
  }

  // trial-expired, past-due ou canceled
  const titulo =
    reason === "trial-expired"
      ? "Seu período gratuito acabou"
      : reason === "past-due"
        ? "Assinatura com pagamento em atraso"
        : "Assinatura cancelada";
  const sub =
    reason === "trial-expired"
      ? "Pra continuar usando, assine um dos planos."
      : reason === "past-due"
        ? "Regularize o pagamento pra voltar a usar."
        : "Reative no painel de planos pra continuar.";

  return (
    <div className="flex items-center gap-3 border-b border-red-300 bg-red-50 px-8 py-3 text-sm text-red-900">
      <AlertTriangle className="h-4 w-4 shrink-0" />
      <p className="flex-1">
        <strong>{titulo}.</strong> {sub} Seus dados estão salvos.
      </p>
      <Link
        href="/configuracoes/plano"
        className="rounded-md bg-red-700 px-3 py-1 text-xs font-medium text-white hover:bg-red-800"
      >
        Assinar agora
      </Link>
    </div>
  );
}

export function SubscriptionGate({
  info,
  children,
}: {
  info: AccessInfo;
  children: React.ReactNode;
}) {
  if (info.hasAccess) return <>{children}</>;

  return (
    <div className="mx-auto max-w-2xl py-12">
      <div className="rounded-lg border border-red-200 bg-red-50/40 p-8 text-center">
        <AlertCircle className="mx-auto mb-4 h-12 w-12 text-red-600" />
        <h2 className="text-2xl font-bold text-red-900">
          Acesso bloqueado
        </h2>
        <p className="mt-2 text-sm text-red-800">
          Seu período gratuito acabou. Assine pra continuar usando o SaaS Galpão.
        </p>
        <p className="mt-4 text-xs text-red-700">
          Seus dados estão preservados e voltam imediatamente após a assinatura.
        </p>
        <Link
          href="/configuracoes/plano"
          className="mt-6 inline-block rounded-md bg-red-700 px-6 py-2 text-sm font-medium text-white hover:bg-red-800"
        >
          Ver planos e assinar
        </Link>
      </div>
    </div>
  );
}
