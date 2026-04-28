# Arquitetura — SaaS Galpão

## Visão geral

Aplicação **monolítica modular** Next.js 15 (App Router), full-stack TypeScript, com banco PostgreSQL e isolamento multi-tenant por linha (`tenantId`).

```
┌─────────────────────────────────────────────────────────────┐
│  Browser (React Server Components + Client Components)       │
└────────────────┬────────────────────────────────────────────┘
                 │ HTTPS (Vercel edge)
┌────────────────▼────────────────────────────────────────────┐
│  Next.js 15 (App Router)                                     │
│  ├── (auth) routes        → login, register                  │
│  ├── (dashboard) routes   → área logada (RSC)                │
│  ├── api/                 → REST endpoints                   │
│  └── middleware.ts        → auth gate                        │
└──────────┬─────────────────────┬───────────────┬────────────┘
           │                     │               │
           ▼                     ▼               ▼
    ┌──────────────┐      ┌────────────┐  ┌──────────────┐
    │  Postgres    │      │ Anthropic  │  │  Supabase    │
    │  (Neon)      │      │ (Claude)   │  │  Storage     │
    │  via Prisma  │      │            │  │  (PDFs)      │
    └──────────────┘      └────────────┘  └──────────────┘
```

## Decisões e trade-offs

### 1. Por que Next.js full-stack (e não front+back separados)?
**Trade-off:** acoplamento vs simplicidade. Para um SaaS desse porte (1 produto, 1 time), monolito Next.js é mais rápido pra entregar e mais barato pra hospedar. Quando crescer (mobile app, equipes separadas), extrai a API para um serviço NestJS/Fastify.

### 2. Por que multi-tenant por linha (`tenantId`) e não schema-per-tenant?
**Trade-off:** isolamento vs operação. Schema-per-tenant dá isolamento mais forte mas vira pesadelo de migração e backup quando há centenas de tenants. Isolamento por linha + queries sempre escopadas + Row-Level Security futuro do Postgres é o caminho industry-standard (ver Supabase, PostgREST).

**Garantia:** o helper `requireAuth()` em `src/lib/tenant.ts` lê `tenantId` do JWT da sessão (assinado, não falsificável). Toda query usa `where: { tenantId, ... }`. Code review deve rejeitar qualquer query que esqueça o `tenantId`.

### 3. Por que Auth.js v5 + Credentials e não Clerk/Supabase Auth?
**Trade-off:** controle vs setup. Auth.js dá controle total da sessão, RBAC, hooks. Clerk/Supabase economizam código mas adicionam vendor lock-in e custo por MAU. Para um SaaS B2B com poucos usuários por tenant, self-hosted compensa.

### 4. Por que Prisma e não Drizzle?
**Trade-off:** maturidade vs performance. Drizzle é mais rápido em queries grandes. Prisma é mais maduro, com melhor DX e Studio. Para volume MVP, Prisma vence.

### 5. Por que JWT (e não session em DB)?
**Trade-off:** revogação vs escala. JWT é stateless — perfeito pra Vercel edge. Para revogar (logout forçado), precisaríamos de denylist em Redis. Aceitável: TTL de 8h reduz janela de risco.

## Modelo de dados

Ver [`prisma/schema.prisma`](../prisma/schema.prisma). Resumo:

```
Tenant (1) ── (N) User
   │
   ├── (N) Galpao ── (N) Contrato ── (N) Receita
   ├── (N) Despesa
   ├── (N) Alerta
   └── (N) AuditLog
```

**Índices críticos:**
- `(tenantId, status)` em Galpao, Contrato, Receita — usado em todos os filtros do dashboard
- `(tenantId, vencimento)` em Receita/Despesa — alertas de inadimplência
- `(tenantId, dataFim)` em Contrato — alertas de vencimento

## Camadas de validação

```
Request → Zod schema → Prisma typed query → Response
            │              │
            └──→ apiError() ←──── ZodError / PrismaError
```

Toda rota API segue o mesmo padrão:
1. `requireAuth()` ou `requireRole()` — extrai `ctx` da sessão
2. Parse do body com `xxxSchema.parse()` (Zod)
3. Query Prisma escopada por `ctx.tenantId`
4. Try/catch envolvendo tudo, com `apiError()` no catch

## Segurança em camadas

| Camada | Proteção |
|---|---|
| Edge (Vercel) | HTTPS forçado, DDoS básico, geo-routing |
| Headers | HSTS, X-Frame-Options, CSP base, Permissions-Policy |
| Middleware | Redirect não autenticado para `/login` |
| API | `requireAuth()` + `requireRole()` + Zod |
| DB | `tenantId` em toda query + bcrypt cost 12 |
| Logs | `AuditLog` para ações sensíveis |

## Performance

- **RSC por padrão:** pages do dashboard são Server Components — zero JS no cliente exceto onde necessário (forms, modais).
- **Prisma com pooling:** usar pgBouncer/Neon pooler em prod (`?pgbouncer=true`).
- **Prompt caching nos agentes:** system prompt longo dos agentes IA é marcado com `cache_control: ephemeral` — corta latência e custo em chamadas subsequentes.

## Próximos passos

1. **Cron jobs (Vercel Cron):** gerar receitas mensais auto, enviar emails de vencimento, marcar receitas como ATRASADO.
2. **Upload de PDFs:** integração Supabase Storage com URLs assinadas.
3. **Exportação Excel:** `xlsx` lib para receitas/despesas.
4. **Testes E2E:** Playwright cobrindo login → criar galpão → criar contrato → ver dashboard.
5. **Observabilidade:** Sentry para erros, Vercel Analytics para perf.
6. **Rate limiting:** Upstash Redis na API (login + endpoints de IA).
