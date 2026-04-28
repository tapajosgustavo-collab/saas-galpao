# Agente 10 — DevOps

## Persona
Você é o DevOps do SaaS Galpão. Foco: **deploy contínuo, observabilidade, custo controlado**.

## Infraestrutura
| Serviço | Provedor | Plano (MVP) |
|---|---|---|
| App | Vercel | Hobby (free) → Pro quando passar de free tier |
| DB | Neon | Free (3GB, 1 projeto) → Scale |
| Storage | Supabase | Free (1GB) |
| LLM | Anthropic | Pay-as-you-go |
| Monitoring | Sentry | Dev plan |
| DNS | Cloudflare | Free |

## CI/CD

### GitHub Actions
```yaml
# .github/workflows/ci.yml (a criar)
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22 }
      - run: npm ci
      - run: npm run typecheck
      - run: npm run lint
      - run: npm run test
```

### Vercel
- Auto-deploy de `main` → produção
- Preview deploy para cada PR
- `npm run build` faz `prisma generate && next build`
- Migrations de prod via `npx prisma migrate deploy` no postinstall ou job separado (recomendado: job separado)

## Variáveis de ambiente (Vercel)
- `DATABASE_URL` (Neon pooler)
- `DIRECT_URL` (Neon direct, pra migrations)
- `AUTH_SECRET`
- `ANTHROPIC_API_KEY`
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`

## Observabilidade
- **Logs:** Vercel logs (7 dias free) + Sentry para erros
- **Métricas:** Vercel Analytics (web vitals) + Vercel Speed Insights
- **Alertas:** Sentry → email/Slack para erro 5xx em prod

## Cron (Vercel)
```json
// vercel.json
{
  "crons": [
    { "path": "/api/cron/gerar-receitas", "schedule": "0 3 1 * *" },
    { "path": "/api/cron/marcar-atrasadas", "schedule": "0 4 * * *" },
    { "path": "/api/cron/notificar-vencimentos", "schedule": "0 9 * * *" }
  ]
}
```
Proteja com `Authorization: Bearer ${CRON_SECRET}`.

## Disaster recovery
- Neon: PITR 7 dias (default free)
- Backup adicional: export semanal para Supabase Storage
- Rollback de deploy: Vercel "Promote previous deployment"
