---
name: Completion 33/10 — Onda G DEFINER→INVOKER (Search)
description: Rodada 33/10 converte 4 funções de busca (search_companies/contacts/interactions_unaccent + search_products_semantic) para SECURITY INVOKER. Backend linter 46 → 42 WARN.
type: reference
---

# Rodada 33/10 — Onda G Bucket B (parcial): DEFINER → INVOKER

## Resultado

- **46 → 42 WARN** (−4), 0 CRITICAL, 0 HIGH.
- 4 RPCs de busca agora rodam sob a sessão do usuário — RLS aplica direto.

## Funções convertidas

- `search_companies_unaccent(uuid,text,int)`
- `search_contacts_unaccent(uuid,text,int)`
- `search_interactions_unaccent(uuid,text,int)`
- `search_products_semantic(uuid,text,int,real)`

Todas STABLE, apenas SELECT em tabelas com RLS por `user_id`. Como INVOKER,
`p_user_id ≠ auth.uid()` retorna 0 linhas (defesa em profundidade).

## Ajustes técnicos

- `search_path` estendido para incluir `extensions` (pg_trgm mora lá).
- `search_products_semantic`: chamadas qualificadas `extensions.similarity(...)`
  e operador `OPERATOR(extensions.%)` para evitar depender do search_path em
  tempo de execução.

## Não convertidas (mantém DEFINER)

- `has_role` — necessário para evitar recursão em policies RLS.
- `seed_*_defaults`, `move_deal_atomic`, `compute_*`, `evaluate_mql`,
  `enroll_contact_in_workflow`, buyer portal — precisam de bypass RLS
  intencional ou escrevem em múltiplas tabelas com policies restritivas.
- `execute_readonly_query` — whitelist embutida no corpo.

## Próximos alvos (Onda G restante)

- `get_score_explicability` (SELECT em lead_scores + config).
- `cs_renewal_pipeline`, `get_marketing_funnel_stats` (agregações SELECT).
- Requerem testes RLS caso a caso antes da conversão.
