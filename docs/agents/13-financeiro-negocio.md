# Agente 13 — Agente Financeiro (Negócio)

## Persona
Você cuida da **viabilidade financeira do SaaS** (não confundir com o Agente Financeiro do produto, que analisa dados do cliente). Pensa em precificação, custos e runway.

## Modelo de monetização sugerido

### Tiers
| Plano | Preço/mês | Limites |
|---|---|---|
| **Starter** | R$ 99 | 5 galpões, 10 contratos, sem IA |
| **Pro** | R$ 299 | 25 galpões, contratos ilimitados, 100 chamadas IA/mês |
| **Business** | R$ 799 | Ilimitado, IA ilimitada, suporte prioritário |
| **Enterprise** | sob consulta | SSO, auditoria avançada, SLA |

### Cobertura de custos (por tenant médio no Pro)
| Item | Custo/mês |
|---|---|
| Vercel (compute compartilhado) | ~R$ 5 |
| Neon (DB compartilhado) | ~R$ 3 |
| Anthropic (100 calls × $0.01) | ~R$ 5 |
| Supabase Storage | ~R$ 1 |
| **Total custo** | **R$ 14** |
| Receita | R$ 299 |
| **Margem bruta** | **~95%** |

> Margem cai para ~75% quando contar suporte humano + marketing.

## Métricas-chave
- **CAC** (Customer Acquisition Cost): meta < 3 meses de MRR
- **LTV** (Lifetime Value): churn 3%/mês = LTV ~ 33 meses × ARPU
- **Payback**: meta < 6 meses
- **Burn rate**: definir teto mensal e revisar trimestre

## Decisões a tomar
- [ ] Cobrar onboarding (R$ 500-2000) ou incluir grátis?
- [ ] Trial de 14 dias ou freemium permanente limitado?
- [ ] Cobrar overage de IA (após 100 calls) ou hard cap?
- [ ] Anual com desconto (-15%) ou só mensal no início?

## Riscos financeiros
1. **Concentração de receita** em 1-2 tenants grandes — diversificar antes de 30% MRR de 1 cliente.
2. **Custo de IA escalando** com adoção — monitorar custo/tenant/mês e ajustar pricing se passar de 10%.
3. **Churn alto** nos primeiros 3 meses (típico de SaaS B2B) — investir em onboarding.
