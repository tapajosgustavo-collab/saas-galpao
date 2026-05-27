"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  Building2,
  LayoutDashboard,
  FileText,
  Wallet,
  Sparkles,
  LogOut,
  Users,
  Bell,
  CreditCard,
  Shield,
  Loader2,
  KeyRound,
} from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/galpoes", label: "Galpões", icon: Building2 },
  { href: "/contratos", label: "Contratos", icon: FileText },
  { href: "/financeiro", label: "Financeiro", icon: Wallet },
  { href: "/alertas", label: "Alertas", icon: Bell },
  { href: "/insights", label: "Insights IA", icon: Sparkles },
  { href: "/equipe", label: "Equipe", icon: Users },
];

export function Sidebar({
  alertasNaoLidos = 0,
  showAdminLink = false,
}: {
  alertasNaoLidos?: number;
  showAdminLink?: boolean;
}) {
  const pathname = usePathname();
  return (
    <aside className="flex h-screen w-60 flex-col border-r bg-white">
      <div className="flex items-center gap-2 border-b px-6 py-4">
        <Building2 className="h-5 w-5 text-primary" />
        <span className="font-bold">SaaS Galpão</span>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {items.map((it) => {
          const active = pathname === it.href || pathname.startsWith(`${it.href}/`);
          const Icon = it.icon;
          return (
            <Link
              key={it.href}
              href={it.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-slate-600 hover:bg-slate-100",
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="flex-1">{it.label}</span>
              {it.href === "/alertas" && alertasNaoLidos > 0 && (
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                    active
                      ? "bg-white/20 text-white"
                      : "bg-red-100 text-red-700",
                  )}
                >
                  {alertasNaoLidos > 99 ? "99+" : alertasNaoLidos}
                </span>
              )}
            </Link>
          );
        })}

        <div className="my-3 border-t" />

        <Link
          href="/configuracoes/plano"
          className={cn(
            "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
            pathname.startsWith("/configuracoes")
              ? "bg-primary text-primary-foreground"
              : "text-slate-600 hover:bg-slate-100",
          )}
        >
          <CreditCard className="h-4 w-4" />
          <span className="flex-1">Plano</span>
        </Link>

        <Link
          href="/configuracoes/api-keys"
          className={cn(
            "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
            pathname.startsWith("/configuracoes/api-keys")
              ? "bg-primary text-primary-foreground"
              : "text-slate-600 hover:bg-slate-100",
          )}
        >
          <KeyRound className="h-4 w-4" />
          <span className="flex-1">API Keys</span>
        </Link>

        {showAdminLink && (
          <Link
            href="/admin/tenants"
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              pathname.startsWith("/admin")
                ? "bg-purple-600 text-white"
                : "text-purple-700 hover:bg-purple-50",
            )}
          >
            <Shield className="h-4 w-4" />
            <span className="flex-1">Admin</span>
          </Link>
        )}
      </nav>
      <div className="border-t p-3">
        <SignOutButton />
      </div>
    </aside>
  );
}

function SignOutButton() {
  const [loading, setLoading] = useState(false);
  return (
    <button
      type="button"
      disabled={loading}
      onClick={async () => {
        setLoading(true);
        await signOut({ callbackUrl: "/login" });
      }}
      className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 disabled:opacity-50"
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
      {loading ? "Saindo..." : "Sair"}
    </button>
  );
}
