import { prisma } from "@/lib/prisma";
import { Plan, SubscriptionStatus, type Subscription } from "@prisma/client";

export const TRIAL_DAYS = 14;

/** Lista de emails com acesso ao backoffice. Configurada via env var. */
export function isSuperAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  const list = (process.env.SUPER_ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return list.includes(email.toLowerCase());
}

/** Cria a subscription inicial pra um tenant (chamado no register). */
export async function createTrialSubscription(tenantId: string) {
  const trialEndsAt = new Date();
  trialEndsAt.setDate(trialEndsAt.getDate() + TRIAL_DAYS);
  return prisma.subscription.create({
    data: {
      tenantId,
      plan: Plan.STARTER,
      status: SubscriptionStatus.TRIALING,
      trialEndsAt,
      currentPeriodEnd: trialEndsAt,
    },
  });
}

/** Pega a subscription de um tenant; cria uma de trial se nao existir. */
export async function getOrCreateSubscription(
  tenantId: string,
): Promise<Subscription> {
  const existing = await prisma.subscription.findUnique({
    where: { tenantId },
  });
  if (existing) return existing;
  return createTrialSubscription(tenantId);
}

export interface AccessInfo {
  hasAccess: boolean;
  daysLeftInTrial: number; // negativo se ja expirou
  reason: "trial-active" | "trial-expired" | "active" | "past-due" | "canceled";
  sub: Subscription;
}

/** Decide se o tenant pode usar o app. */
export function evaluateAccess(sub: Subscription): AccessInfo {
  const now = Date.now();
  const trialMs = sub.trialEndsAt.getTime() - now;
  const daysLeftInTrial = Math.ceil(trialMs / (1000 * 60 * 60 * 24));

  if (sub.status === SubscriptionStatus.ACTIVE) {
    return { hasAccess: true, daysLeftInTrial, reason: "active", sub };
  }
  if (sub.status === SubscriptionStatus.TRIALING) {
    if (trialMs > 0) {
      return { hasAccess: true, daysLeftInTrial, reason: "trial-active", sub };
    }
    return { hasAccess: false, daysLeftInTrial, reason: "trial-expired", sub };
  }
  if (sub.status === SubscriptionStatus.PAST_DUE) {
    return { hasAccess: false, daysLeftInTrial, reason: "past-due", sub };
  }
  return { hasAccess: false, daysLeftInTrial, reason: "canceled", sub };
}

export const PLAN_INFO: Record<
  Plan,
  { label: string; preco: string; precoNum: number; recursos: string[] }
> = {
  STARTER: {
    label: "Starter",
    preco: "R$ 199",
    precoNum: 199,
    recursos: [
      "Até 5 galpões",
      "Até 3 usuários",
      "Documentos com vencimento",
      "Manutenções com fotos",
      "Vistorias inicial/final",
      "Cron diário de alertas",
    ],
  },
  PRO: {
    label: "Pro",
    preco: "R$ 499",
    precoNum: 499,
    recursos: [
      "Até 25 galpões",
      "Usuários ilimitados",
      "Tudo do Starter",
      "Agentes IA (100 chamadas/mês)",
      "Exportação Excel",
      "Notificação por email (em breve)",
      "Suporte prioritário",
    ],
  },
  BUSINESS: {
    label: "Business",
    preco: "R$ 1.299",
    precoNum: 1299,
    recursos: [
      "Galpões ilimitados",
      "Tudo do Pro",
      "Agentes IA ilimitados",
      "Domínio próprio",
      "API pra ERP",
      "Onboarding dedicado",
    ],
  },
  ENTERPRISE: {
    label: "Enterprise",
    preco: "Sob consulta",
    precoNum: 0,
    recursos: ["SSO", "SLA contratual", "Auditoria avançada", "Conta dedicada"],
  },
};
