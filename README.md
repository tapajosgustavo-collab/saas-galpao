# SaaS Galpão

Plataforma SaaS multi-tenant para gestão de galpões industriais — cadastro de galpões, contratos de aluguel, financeiro, ocupação e automações com IA (Claude).

> Status: **MVP em desenvolvimento.** Estrutura completa, autenticação multi-tenant, CRUD de galpões/contratos, módulo financeiro, dashboard, e 4 agentes de IA stubados.

---

## 🛠 Stack

| Camada | Tecnologia |
|---|---|
| Frontend + API | Next.js 15 (App Router) + TypeScript strict |
| UI | Tailwind CSS + shadcn/ui + Recharts + Lucide |
| Banco | PostgreSQL + Prisma 6 |
| Auth | Auth.js v5 (NextAuth) + bcrypt + JWT |
| Validação | Zod em todas as boundaries |
| IA | Anthropic SDK + Claude Sonnet 4.6 |
| Storage | Supabase Storage (PDFs de contrato) |
| Deploy | Vercel + Neon (Postgres serverless) |

## 📁 Estrutura

```
saas-galpao/
├── prisma/
│   ├── schema.prisma          # multi-tenant, todas as entidades
│   └── seed.ts                # dados de exemplo
├── src/
│   ├── app/
│   │   ├── (auth)/            # login, register
│   │   ├── (dashboard)/       # área logada (sidebar + header)
│   │   │   ├── dashboard/     # home com KPIs
│   │   │   ├── galpoes/
│   │   │   ├── contratos/
│   │   │   ├── financeiro/
│   │   │   └── insights/      # agentes de IA
│   │   ├── api/
│   │   │   ├── auth/          # NextAuth handlers
│   │   │   ├── register/      # cria tenant + admin
│   │   │   ├── galpoes/
│   │   │   ├── contratos/
│   │   │   ├── financeiro/
│   │   │   └── agents/        # endpoints dos agentes IA
│   │   ├── layout.tsx
│   │   └── page.tsx           # landing
│   ├── components/
│   │   ├── ui/                # shadcn primitivos
│   │   └── sidebar.tsx
│   ├── lib/
│   │   ├── agents/            # 4 agentes de IA
│   │   ├── validators/        # schemas Zod
│   │   ├── auth.ts            # Auth.js config
│   │   ├── prisma.ts          # singleton
│   │   ├── tenant.ts          # requireAuth / requireRole
│   │   └── api.ts             # apiError handler
│   └── middleware.ts          # proteção de rotas
└── docs/
    ├── architecture.md
    └── agents/                # prompts dos 14 agentes de construção
```

## 🚀 Como rodar localmente

```bash
# 1. Instale dependências
npm install

# 2. Configure variáveis
cp .env.example .env
# preencha DATABASE_URL (Postgres local, Neon ou Supabase)
# gere AUTH_SECRET com: openssl rand -base64 32

# 3. Migre o banco e popule com seed
npm run db:migrate
npm run db:seed

# 4. Rode o dev server
npm run dev
```

Acesse http://localhost:3000 — login: `admin@demo.com` / `admin12345`.

## 🔐 Segurança

- **Multi-tenant isolation:** todas as queries são escopadas por `tenantId` via helper `requireAuth()`. O `tenantId` vem da sessão JWT, nunca do request.
- **RBAC:** 3 papéis (ADMIN, GESTOR, FINANCEIRO) — checados em cada API mutativa via `requireRole()`.
- **Senhas:** bcrypt com cost 12.
- **Headers de segurança:** HSTS, X-Frame-Options DENY, X-Content-Type-Options nosniff, Referrer-Policy strict-origin-when-cross-origin (ver `next.config.ts`).
- **Validação:** Zod em **toda** entrada da API. Erros padronizados em `apiError()`.
- **Audit log:** modelo `AuditLog` pronto para registrar ações sensíveis.

## 🤖 Agentes de IA (produto)

Quatro agentes Claude analisam dados do tenant em tempo real:

| Agente | Função |
|---|---|
| **Financeiro** | Fluxo de caixa, inadimplência, sugestões de ajuste |
| **Contratos** | Resumo, riscos, lembretes de renovação |
| **Operacional** | Ocupação, ociosidade, subutilização |
| **Analítico** | Insights estratégicos cruzando todas as áreas |

Endpoints: `POST /api/agents/{financeiro|operacional|analitico}` — autenticado, escopado por tenant.

## 📋 MVP shipping list

- [x] Esqueleto Next.js + TS + Tailwind
- [x] Schema multi-tenant
- [x] Auth (login + registro com criação de tenant)
- [x] CRUD Galpões
- [x] CRUD Contratos
- [x] Módulo Financeiro (receitas + despesas)
- [x] Dashboard com KPIs e alertas
- [x] 4 agentes IA stubados
- [ ] Upload de PDF de contrato (Supabase)
- [ ] Geração automática de receitas mensais (cron)
- [ ] Notificações por email (vencimentos)
- [ ] Exportação Excel
- [ ] Testes E2E (Playwright)

## 📚 Documentação

- [`docs/architecture.md`](docs/architecture.md) — arquitetura completa, decisões e trade-offs
- [`docs/agents/`](docs/agents/) — prompts dos 14 agentes de construção (CEO, PM, UX, Devs, QA, DevOps, etc.)

## 📝 Licença

Privado.
