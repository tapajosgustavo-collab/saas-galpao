import Link from "next/link";
import { Building2, Check, Sparkles } from "lucide-react";
import { PLAN_INFO } from "@/lib/subscription";

const PLANOS_PUBLICOS = ["STARTER", "PRO", "BUSINESS"] as const;

export default function PlanosPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <header className="container flex items-center justify-between py-6">
        <Link href="/" className="flex items-center gap-2">
          <Building2 className="h-6 w-6 text-primary" />
          <span className="text-lg font-bold">SaaS Galpão</span>
        </Link>
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

      <section className="container pt-12 text-center">
        <h1 className="text-4xl font-bold tracking-tight">Planos transparentes</h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
          Comece com <strong>14 dias grátis</strong> em qualquer plano. Sem
          cartão de crédito. Cancele quando quiser.
        </p>
      </section>

      <section className="container py-12">
        <div className="grid gap-6 md:grid-cols-3">
          {PLANOS_PUBLICOS.map((p) => {
            const info = PLAN_INFO[p];
            const destacado = p === "PRO";
            return (
              <div
                key={p}
                className={`rounded-2xl border p-8 ${
                  destacado
                    ? "border-primary bg-primary/5 shadow-lg"
                    : "border-slate-200 bg-white"
                }`}
              >
                {destacado && (
                  <div className="mb-3 inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                    <Sparkles className="h-3 w-3" />
                    Mais escolhido
                  </div>
                )}
                <h2 className="text-2xl font-bold">{info.label}</h2>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-4xl font-bold">{info.preco}</span>
                  <span className="text-slate-500">/mês</span>
                </div>
                <Link
                  href="/register"
                  className={`mt-6 block w-full rounded-md py-2 text-center text-sm font-medium ${
                    destacado
                      ? "bg-primary text-primary-foreground hover:opacity-90"
                      : "border border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  Começar 14 dias grátis
                </Link>
                <ul className="mt-6 space-y-2 text-sm">
                  {info.recursos.map((r) => (
                    <li key={r} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        <div className="mx-auto mt-10 max-w-2xl rounded-lg border bg-white p-6 text-center text-sm text-slate-600">
          <h3 className="text-base font-semibold text-slate-900">Enterprise</h3>
          <p className="mt-2">
            Mais de 100 galpões, integração com ERP, SSO, SLA contratual?
          </p>
          <a
            href="mailto:contato@saasgalpao.com.br"
            className="mt-3 inline-block text-primary hover:underline"
          >
            Fale com a gente
          </a>
        </div>
      </section>

      <section className="container py-16">
        <h2 className="text-center text-2xl font-bold">Perguntas frequentes</h2>
        <div className="mx-auto mt-8 max-w-2xl space-y-4">
          <Faq q="Como funciona o trial de 14 dias?">
            Cadastre sua empresa e use todos os recursos do plano por 14 dias
            sem cobrança. Não pedimos cartão antes. Após o trial, escolha um
            plano pra continuar — seus dados ficam preservados.
          </Faq>
          <Faq q="Como pago?">
            Hoje aceitamos Pix mensal (cobrança recorrente automática vem em
            breve via Asaas). Após cadastro, te enviamos o QR Code do plano
            escolhido.
          </Faq>
          <Faq q="Os dados ficam seguros?">
            Sim — multi-tenant por linha (seus dados ficam isolados dos demais
            clientes), HTTPS forçado, senhas com bcrypt cost 12, JWT, headers
            de segurança HSTS, X-Frame DENY etc.
          </Faq>
          <Faq q="Posso convidar minha equipe?">
            Sim, em todos os planos (Starter limita a 3 usuários, Pro e
            Business são ilimitados).
          </Faq>
          <Faq q="O que tem de IA?">
            4 agentes que analisam financeiro, contratos, ocupação e geram
            insights cruzados. Roadmap inclui extração de PDF
            (AVCB/IPTU/contrato auto-preenchidos) e chat assistente.
          </Faq>
        </div>
      </section>
    </main>
  );
}

function Faq({ q, children }: { q: string; children: React.ReactNode }) {
  return (
    <details className="rounded-md border bg-white p-4">
      <summary className="cursor-pointer text-sm font-semibold">{q}</summary>
      <p className="mt-2 text-sm text-slate-600">{children}</p>
    </details>
  );
}
