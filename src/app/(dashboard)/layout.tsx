import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Sidebar } from "@/components/sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-slate-50">
        <header className="flex items-center justify-between border-b bg-white px-8 py-4">
          <div className="text-sm text-slate-500">
            Olá, <span className="font-medium text-slate-900">{session.user.name}</span>
          </div>
          <div className="text-xs text-slate-400">
            {session.user.role} · tenant {session.user.tenantId.slice(0, 8)}
          </div>
        </header>
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
