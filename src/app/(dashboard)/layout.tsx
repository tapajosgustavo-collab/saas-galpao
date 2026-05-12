import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Sidebar } from "@/components/sidebar";
import { SubscriptionBanner } from "@/components/subscription-banner";
import {
  evaluateAccess,
  getOrCreateSubscription,
  isSuperAdmin,
} from "@/lib/subscription";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const sub = await getOrCreateSubscription(session.user.tenantId);
  const access = evaluateAccess(sub);

  const alertasNaoLidos = await prisma.alerta.count({
    where: { tenantId: session.user.tenantId, lido: false },
  });

  const showAdminLink = isSuperAdmin(session.user.email);

  return (
    <div className="flex h-screen">
      <Sidebar
        alertasNaoLidos={alertasNaoLidos}
        showAdminLink={showAdminLink}
      />
      <main className="flex-1 overflow-y-auto bg-slate-50">
        <header className="flex items-center justify-between border-b bg-white px-8 py-4">
          <div className="text-sm text-slate-500">
            Olá, <span className="font-medium text-slate-900">{session.user.name}</span>
            <span className="ml-2 text-xs text-slate-400">
              ({session.user.email})
            </span>
          </div>
          <div className="text-xs text-slate-400">
            {showAdminLink && (
              <span className="mr-2 rounded bg-purple-100 px-2 py-0.5 font-semibold text-purple-700">
                SUPER ADMIN
              </span>
            )}
            {session.user.role} · tenant {session.user.tenantId.slice(0, 8)}
          </div>
        </header>
        <SubscriptionBanner info={access} />
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
