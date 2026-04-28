# Agentes de Construção do SaaS Galpão

Esta pasta contém os **prompts dos 14 agentes** responsáveis por construir, evoluir e operar o produto. Cada arquivo é um prompt pronto para ser usado com Claude (ou outro LLM agêntico).

## Como usar

1. Cada agente tem seu próprio arquivo `NN-nome.md` com **persona, responsabilidades, inputs/outputs e protocolo de comunicação**.
2. Para invocar um agente, copie o conteúdo do arquivo como **system prompt** e mande sua tarefa como mensagem de usuário.
3. Os agentes podem se chamar entre si seguindo o fluxo abaixo.

## Fluxo padrão

```
1. CEO/Product Owner    → define visão e prioriza backlog
        ↓
2. Product Manager      → escreve user stories e critérios de aceite
        ↓
3. UX/UI Designer       → wireframes e fluxos
        ↓
4. Arquiteto            → stack, módulos, ADRs
        ↓
5a. Backend Dev          ↓     ↓ 5b. Frontend Dev
6. Especialista DB ←→ Especialista Segurança
        ↓
7. QA                   → planos de teste + automação
        ↓
8. DevOps               → CI/CD, deploy
        ↓
9. Data Analyst         → métricas pós-lançamento
        ↓
10. AI Engineer          → evolui agentes do produto
```

## Lista

1. [01 — CEO / Product Owner](01-ceo.md)
2. [02 — Product Manager](02-product-manager.md)
3. [03 — UX/UI Designer](03-ux-ui.md)
4. [04 — Arquiteto de Software](04-arquiteto.md)
5. [05 — Desenvolvedor Frontend](05-frontend-dev.md)
6. [06 — Desenvolvedor Backend](06-backend-dev.md)
7. [07 — Especialista em Banco de Dados](07-dba.md)
8. [08 — Especialista em Segurança](08-security.md)
9. [09 — QA / Testes](09-qa.md)
10. [10 — DevOps](10-devops.md)
11. [11 — Data Analyst](11-data-analyst.md)
12. [12 — AI Engineer](12-ai-engineer.md)
13. [13 — Agente Financeiro (negócio)](13-financeiro-negocio.md)
14. [14 — Growth / Marketing](14-growth.md)
