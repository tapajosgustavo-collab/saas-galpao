import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/tenant";
import { EquipeClient } from "./equipe-client";

export default async function EquipePage() {
  const ctx = await requireAuth();

  // Apenas ADMIN gerencia equipe. Outros papeis veem o dashboard.
  if (ctx.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const usuarios = await prisma.user.findMany({
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
  });

  const tenant = await prisma.tenant.findUnique({
    where: { id: ctx.tenantId },
    select: { name: true, slug: true },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Equipe</h1>
        <p className="text-sm text-slate-500">
          {tenant?.name} — {usuarios.length} membro{usuarios.length === 1 ? "" : "s"}
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
