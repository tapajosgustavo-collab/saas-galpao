import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/tenant";
import { checkUserSlot, formatLimit, nextPlan } from "@/lib/plan-limits";
import { EquipeClient } from "./equipe-client";

export default async function EquipePage() {
  const ctx = await requireAuth();

  // Apenas ADMIN gerencia equipe. Outros papeis veem o dashboard.
  if (ctx.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const [usuarios, tenant, slot] = await Promise.all([
    prisma.user.findMany({
      where: { tenantId: ctx.tenantId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        active: true,
        inviteToken: true,
        inviteExpires: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.tenant.findUnique({
      where: { id: ctx.tenantId },
      select: { name: true, slug: true },
    }),
    checkUserSlot(ctx.tenantId),
  ]);

  const limitMax = formatLimit(slot.max);
  const np = nextPlan(slot.plan);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Equipe</h1>
        <p className="text-sm text-slate-500">
          {tenant?.name} — {slot.current} de {limitMax} usuários ativos — plano{" "}
          <strong>{slot.plan}</strong>
          {!slot.allowed && (
            <span className="ml-2 rounded bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
              limite atingido — {np ? `upgrade pra ${np}` : "contate suporte"}
            </span>
          )}
        </p>
      </div>
      <EquipeClient
        currentUserId={ctx.userId}
        usuarios={usuarios.map((u) => ({
          id: u.id,
          email: u.email,
          name: u.name,
          role: u.role,
          active: u.active,
          pending: !!u.inviteToken,
          inviteExpires: u.inviteExpires
            ? u.inviteExpires.toISOString()
            : null,
          createdAt: u.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
