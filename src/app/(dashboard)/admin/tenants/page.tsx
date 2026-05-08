import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/tenant";
import { isSuperAdmin, evaluateAccess } from "@/lib/subscription";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield } from "lucide-react";
import { TenantsAdminClient } from "./client";

export default async function AdminTenantsPage() {
  const ctx = await requireAuth();
  if (!isSuperAdmin(ctx.email)) {
    redirect("/dashboard");
  }

  const tenants = await prisma.tenant.findMany({
    include: {
      subscription: true,
      _count: {
        select: { users: true, galpoes: true, contratos: true },
      },
      users: {
        where: { role: "ADMIN" },
        select: { email: true, name: true, active: true },
        take: 1,
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const totalAtivos = tenants.filter(
    (t) => t.subscription && evaluateAccess(t.subscription).hasAccess,
  ).length;
  const totalTrial = tenants.filter(
    (t) => t.subscription?.status === "TRIALING",
  ).length;
  const totalBlock = tenants.length - totalAtivos;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-3xl font-bold">
          <Shield className="h-7 w-7 text-purple-600" />
          Backoffice — Tenants
        </h1>
        <p className="text-sm text-slate-500">
          Apenas você (super admin) vê esta página. Use pra ativar manualmente
          após receber o Pix.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Total de tenants</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{tenants.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">
              Em trial / ativos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-700">{totalAtivos}</p>
            <p className="text-xs text-slate-500">{totalTrial} em trial</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Bloqueados</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-700">{totalBlock}</p>
          </CardContent>
        </Card>
      </div>

      <TenantsAdminClient
        tenants={tenants.map((t) => ({
          id: t.id,
          name: t.name,
          slug: t.slug,
          createdAt: t.createdAt.toISOString(),
          adminEmail: t.users[0]?.email ?? "—",
          adminName: t.users[0]?.name ?? "—",
          galpoes: t._count.galpoes,
          contratos: t._count.contratos,
          users: t._count.users,
          sub: t.subscription
            ? {
                id: t.subscription.id,
                plan: t.subscription.plan,
                status: t.subscription.status,
                trialEndsAt: t.subscription.trialEndsAt.toISOString(),
                currentPeriodEnd: t.subscription.currentPeriodEnd.toISOString(),
                notes: t.subscription.notes ?? "",
              }
            : null,
        }))}
      />
    </div>
  );
}
