import { Plan } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getOrCreateSubscription } from "@/lib/subscription";

const UNLIMITED = Number.POSITIVE_INFINITY;

export interface PlanLimits {
  galpoes: number;
  users: number;
  aiAgents: boolean;     // /insights — 4 agentes analisando dados
  aiAssist: boolean;     // assistente que preenche forms (Fase 1.2)
  aiCallsPerMonth: number;
  excelExport: boolean;
  customDomain: boolean;
  sso: boolean;
}

export const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  STARTER: {
    galpoes: 5,
    users: 3,
    aiAgents: false,
    aiAssist: false,
    aiCallsPerMonth: 0,
    excelExport: true,
    apiAccess: false,
    customDomain: false,
    sso: false,
  },
  PRO: {
    galpoes: 25,
    users: UNLIMITED,
    aiAgents: true,
    aiAssist: true,
    aiCallsPerMonth: 100,
    excelExport: true,
    apiAccess: false,
    customDomain: false,
    sso: false,
  },
  BUSINESS: {
    galpoes: UNLIMITED,
    users: UNLIMITED,
    aiAgents: true,
    aiAssist: true,
    aiCallsPerMonth: UNLIMITED,
    excelExport: true,
    apiAccess: true,
    customDomain: true,
    sso: false,
  },
  ENTERPRISE: {
    galpoes: UNLIMITED,
    users: UNLIMITED,
    aiAgents: true,
    aiAssist: true,
    aiCallsPerMonth: UNLIMITED,
    excelExport: true,
    apiAccess: true,
    customDomain: true,
    sso: true,
  },
};

// =========================================================
// Erros
// =========================================================
export class PlanLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PlanLimitError";
  }
}

// =========================================================
// Helpers de formatacao
// =========================================================
export function formatLimit(n: number): string {
  if (!Number.isFinite(n)) return "∞";
  return String(n);
}

export function nextPlan(current: Plan): Plan | null {
  if (current === "STARTER") return "PRO";
  if (current === "PRO") return "BUSINESS";
  if (current === "BUSINESS") return "ENTERPRISE";
  return null;
}

// =========================================================
// Plan resolver
// =========================================================
export async function getPlanLimits(
  tenantId: string,
): Promise<{ plan: Plan; limits: PlanLimits }> {
  const sub = await getOrCreateSubscription(tenantId);
  return { plan: sub.plan, limits: PLAN_LIMITS[sub.plan] };
}

// =========================================================
// Usage checks
// =========================================================
export interface UsageInfo {
  allowed: boolean;
  current: number;
  max: number;
  plan: Plan;
}

export async function checkGalpaoSlot(tenantId: string): Promise<UsageInfo> {
  const { plan, limits } = await getPlanLimits(tenantId);
  const current = await prisma.galpao.count({ where: { tenantId } });
  return { allowed: current < limits.galpoes, current, max: limits.galpoes, plan };
}

export async function checkUserSlot(tenantId: string): Promise<UsageInfo> {
  const { plan, limits } = await getPlanLimits(tenantId);
  const current = await prisma.user.count({
    where: { tenantId, active: true },
  });
  return { allowed: current < limits.users, current, max: limits.users, plan };
}

// =========================================================
// Require helpers — throw 402 quando bate limite
// =========================================================
function upgradeMsg(plan: Plan): string {
  const np = nextPlan(plan);
  return np ? `Upgrade pra ${np} pra continuar.` : "Entre em contato.";
}

export async function requireGalpaoSlot(tenantId: string): Promise<void> {
  const r = await checkGalpaoSlot(tenantId);
  if (!r.allowed) {
    throw new PlanLimitError(
      `Limite do plano ${r.plan} atingido (${r.current}/${formatLimit(r.max)} galpões). ${upgradeMsg(r.plan)}`,
    );
  }
}

export async function requireUserSlot(tenantId: string): Promise<void> {
  const r = await checkUserSlot(tenantId);
  if (!r.allowed) {
    throw new PlanLimitError(
      `Limite do plano ${r.plan} atingido (${r.current}/${formatLimit(r.max)} usuários). ${upgradeMsg(r.plan)}`,
    );
  }
}

export async function requireAIAgents(tenantId: string): Promise<void> {
  const { plan, limits } = await getPlanLimits(tenantId);
  if (!limits.aiAgents) {
    throw new PlanLimitError(
      `Agentes IA disponíveis a partir do plano Pro. Plano atual: ${plan}. ${upgradeMsg(plan)}`,
    );
  }
}

export async function requireApiAccess(tenantId: string): Promise<void> {
  const { plan, limits } = await getPlanLimits(tenantId);
  if (!limits.apiAccess) {
    throw new PlanLimitError(
      `API pública (ERP integration) disponível a partir do plano Business. Plano atual: ${plan}. ${upgradeMsg(plan)}`,
    );
  }
}

export async function requireAIAssist(tenantId: string): Promise<void> {
  const { plan, limits } = await getPlanLimits(tenantId);
  if (!limits.aiAssist) {
    throw new PlanLimitError(
      `Assistente IA disponível a partir do plano Pro. Plano atual: ${plan}. ${upgradeMsg(plan)}`,
    );
  }
}

export async function requireExcelExport(tenantId: string): Promise<void> {
  const { plan, limits } = await getPlanLimits(tenantId);
  if (!limits.excelExport) {
    throw new PlanLimitError(
      `Exportação Excel disponível a partir do plano Pro. Plano atual: ${plan}. ${upgradeMsg(plan)}`,
    );
  }
}
