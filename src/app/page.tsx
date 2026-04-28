import Link from "next/link";
import { ArrowRight, Building2, LineChart, Lock, Sparkles } from "lucide-react";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <header className="container flex items-center justify-between py-6">
        <div className="flex items-center gap-2">
          <Building2 className="h-6 w-6 text-primary" />
          <span className="text-lg font-bold">SaaS Galpão</span>
        </div>
        <nav className="flex items-center gap-3">
          <Link
            href="/login"
            className="rounded-md px-4 py-2 text-sm font-medium hover:bg-slate-100"
          >
            Entrar
          </Link>
          <Link
            href="/register"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            Começar grátis
          </Link>
        </nav>
      </header>

      <section className="container py-20 text-center">
        <h1 className="mx-auto max-w-3xl text-5xl font-bold tracking-tight">
          Gestão completa dos seus galpões industriais — com{" "}
          <span className="text-primary">IA integrada</span>.
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-600">
          Centralize cadastro de galpões, contratos, financeiro e ocupação em uma
          plataforma multi-tenant, segura e automatizada.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Link
            href="/register"
            className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            Criar conta grátis <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/login"
            className="rounded-md border px-6 py-3 text-sm font-semibold hover:bg-slate-50"
          >
            Acessar plataforma
          </Link>
        </div>
      </section>

      <section className="container grid gap-6 py-16 md:grid-cols-3">
        <Feature
          icon={<Building2 className="h-6 w-6 text-primary" />}
          title="Gestão de Galpões"
          desc="Cadastre, monitore status, ocupação e rentabilidade de cada galpão."
        />
        <Feature
          icon={<LineChart className="h-6 w-6 text-primary" />}
          title="Financeiro Inteligente"
          desc="Cobranças automáticas, controle de inadimplência e dashboards em tempo real."
        />
        <Feature
          icon={<Sparkles className="h-6 w-6 text-primary" />}
          title="Agentes de IA"
          desc="Insights automáticos, resumo de contratos e detecção de ociosidade."
        />
      </section>

      <footer className="border-t py-8 text-center text-sm text-slate-500">
        <Lock className="mx-auto mb-2 h-4 w-4" />
        Seus dados são isolados por empresa. Criptografia em trânsito e em repouso.
      </footer>
    </main>
  );
}

function Feature({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="rounded-lg border bg-white p-6 shadow-sm">
      <div className="mb-3">{icon}</div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-slate-600">{desc}</p>
    </div>
  );
}
