# Allowlist — Funções `public.*` executáveis por `authenticated`

> Rodada 48/10 · Baseline histórico: 33 funções. Toda adição/remoção deve atualizar este documento e o teste `tests/rls/functions_authenticated_allowlist.sql`.
>
> **Atualização 2026-10-06 (banco canônico):** o banco real tem ~1.100 funções executáveis por `authenticated` (SECURITY INVOKER, protegidas por RLS), então o teste deixou de exigir a lista de 33. O invariante verificado agora é: `anon` executa **exatamente** as 12 RPCs públicas abaixo (9 originais + `increment_landing_page_view`, `get_public_csat_survey`, `submit_public_csat_survey`) e, entre as `SECURITY DEFINER`, `authenticated` executa só essas 12 + `has_role` + as 15 RPCs do frontend escopadas por `auth.uid()` (migration `20261006130000`). Ver `docs/qa/security-definer-audit.md`.

## Regra

- **Baseline**: exatamente 33 funções ganham `GRANT EXECUTE ... TO authenticated`. Novas funções nascem sem grant e devem ser explicitamente adicionadas via migração + PR revisado.
- **anon** só recebe `EXECUTE` para endpoints públicos (Deal Rooms, Landing Pages, Forms). Total: 9 funções.
- **service_role** sempre recebe `EXECUTE` (defesa em profundidade). Não faz parte deste baseline.

## Categorias

### 🌐 Endpoints públicos (anon + authenticated) — 9
Callable sem sessão via token/slug; RLS por token dentro da função.

| Função | Papel | Justificativa |
|---|---|---|
| `buyer_add_comment(text, text, text)` | DEFINER | Deal Room: comentário do buyer via share_token |
| `buyer_toggle_milestone(text, uuid, boolean, text)` | DEFINER | Deal Room: marca milestone |
| `get_buyer_document_path(text, uuid)` | INVOKER | Deal Room: resolve path assinado |
| `get_deal_room_by_token(text)` | INVOKER | Deal Room: carrega snapshot público |
| `increment_form_view(text)` | INVOKER | Landing/Form: view counter |
| `increment_magnet_view(text)` | INVOKER | Lead Magnet: view counter |
| `record_buyer_view(text, text)` | INVOKER | Deal Room: telemetria de visita |
| `submit_public_form(text, jsonb, jsonb, text, text)` | DEFINER | Landing: captura de lead |
| `track_magnet_download(text, text, text, jsonb)` | DEFINER | Lead Magnet: download tracking |

### 🔐 Auth helper (authenticated) — 1
| Função | Justificativa |
|---|---|
| `has_role(uuid, app_role)` DEFINER | RBAC central; consumido por RLS policies e hooks front |

### 🔎 Busca full-text (authenticated) — 4
| Função | Consumo |
|---|---|
| `search_companies_unaccent(uuid, text, integer)` | `useGlobalSearch` |
| `search_contacts_unaccent(uuid, text, integer)` | `useGlobalSearch` |
| `search_interactions_unaccent(uuid, text, integer)` | `useGlobalSearch` |
| `search_products_semantic(uuid, text, integer, real)` | `useProductSearch` |

### 📊 Analytics/KPIs por usuário (authenticated) — 6
| Função | Consumo |
|---|---|
| `compute_account_health(uuid)` | Dashboard CS |
| `compute_revops_kpis(uuid, date, date)` | Dashboard RevOps |
| `cs_renewal_pipeline(uuid, integer)` | Renewals |
| `get_connection_metrics(uuid)` | `/admin/conexoes` |
| `get_marketing_funnel_stats(uuid, date, date)` | Marketing dashboard |
| `get_score_explicability(uuid)` | `WhyScoreDrawer` |

### 🧠 Gaps comportamentais (authenticated) — 4
| Função | Consumo |
|---|---|
| `check_relationship_consistency(uuid)` | Ficha360 diagnóstico |
| `get_contact_behavior_gaps(uuid)` | Ficha360 → recomendações |
| `get_contact_framework_gaps(uuid)` | Ficha360 → recomendações |
| `get_contact_life_event_gaps(uuid)` | Ficha360 → recomendações |
| `validate_behavioral_consistency(uuid)` | Ficha360 diagnóstico |

### ⚙️ Mutações de negócio (authenticated) — 4
| Função | Consumo |
|---|---|
| `dismiss_revops_alert(uuid)` | Dashboard RevOps |
| `enroll_contact_in_workflow(uuid, uuid)` | Sequências |
| `evaluate_mql(uuid)` | Lead scoring |
| `move_deal_atomic(uuid, text, integer)` + overload numeric | Pipeline drag&drop |

### 🌱 Seeds one-shot (authenticated) — 3
| Função | Consumo |
|---|---|
| `seed_conversation_topics(uuid)` | Onboarding |
| `seed_forecast_period(uuid, text)` | Onboarding |
| `seed_lead_score_defaults(uuid)` | Onboarding |

## Governança

1. Nova função em `public.*` **não** recebe `EXECUTE` a `authenticated` por padrão.
2. Para adicionar: (a) atualizar tabela acima; (b) atualizar array em `tests/rls/functions_authenticated_allowlist.sql`; (c) migração com `GRANT EXECUTE ON FUNCTION public.<fn>(<args>) TO authenticated`.
3. Para remover: `REVOKE EXECUTE ... FROM authenticated` + remover dos dois locais acima.
4. Teste automatizado falha se contagem ≠ 33 ou se aparecer função fora da allowlist.