# Allowlist — Funções `public.*` executáveis por `authenticated`

> Rodada 48/10 · Baseline histórico: 33 funções. Toda adição/remoção deve atualizar este documento e o teste `tests/rls/functions_authenticated_allowlist.sql`.
>
> **Atualização 2026-10-06 (banco canônico):** o banco real tem ~1.100 funções executáveis por `authenticated` (SECURITY INVOKER, protegidas por RLS), então o teste deixou de exigir a lista de 33. O invariante verificado agora é: `anon` executa **exatamente** as 12 RPCs públicas abaixo (9 originais + `increment_landing_page_view`, `get_public_csat_survey`, `submit_public_csat_survey`) e, entre as `SECURITY DEFINER`, `authenticated` executa só essas 12 + `has_role` + as 15 RPCs do frontend escopadas por `auth.uid()` (migration `20261006130000`) + `get_ai_gateway_health` e `get_ai_gateway_partition_stats` (admin-only, migration `20261006140000`). Ver `docs/qa/security-definer-audit.md`.

## Regra

### Mesclagem transacional — atualização autorizada em 2026-10-13

A lista autenticada do teste contém 36 assinaturas, incluindo as 12 RPCs públicas. A lista pública permanece inalterada. A migration `20261013033431_merge_records_atomically.sql` acrescenta à lista autenticada somente:

| Assinatura | Validação |
|---|---|
| `merge_records_atomically(text, uuid, uuid, jsonb)` | Exige sessão autenticada, dois registros do mesmo dono, relações com escopo verificável e campos permitidos; dados e auditoria na mesma transação |
| `merge_companies(uuid, uuid)` | Alias legado; delega à operação central |
| `merge_duplicate_companies(uuid, uuid)` | Alias legado; delega à operação central |
| `merge_contacts(uuid, uuid)` | Alias legado; delega à operação central |
| `merge_duplicate_contacts(uuid, uuid)` | Alias legado; delega à operação central |

Todas fixam `search_path = public, pg_temp`. EXECUTE é revogado de PUBLIC, anon e service_role e concedido apenas a authenticated. Os aliases mantêm a validação central de `auth.role()` e `auth.uid()`, sem permitir acesso administrativo a registros de outro dono. `tests/rls/merge_records_atomic.sql` verifica isolamento, aliases, repetição, conflitos e rollback por falha de auditoria. O teste da allowlist continua rejeitando qualquer assinatura adicional e qualquer grant esperado ausente.

As categorias abaixo conservam o inventário histórico; a lista verificável atual está em `tests/rls/functions_authenticated_allowlist.sql`.

- **Baseline atual**: lista exata de assinaturas autenticadas auditadas no teste. Novas funções nascem sem grant e devem ser explicitamente adicionadas via migração + PR revisado.
- **anon** só recebe `EXECUTE` para as 12 RPCs públicas auditadas.
- **service_role** tem grants explícitos conforme o contrato de cada função; não recebe EXECUTE nas cinco funções de mesclagem.

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

### ⚙️ Mutações de negócio (authenticated) — 5
| Função | Consumo |
|---|---|
| `dismiss_revops_alert(uuid)` | Dashboard RevOps |
| `enroll_contact_in_workflow(uuid, uuid)` | Sequências |
| `confirm_sequence_manual_step(uuid, uuid, text)` | Confirmação manual pelo dono; etapa pendente, evento e avanço na mesma transação |
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
4. Teste automatizado falha se aparecer função fora da allowlist ou se faltar um grant declarado. O total de DEFINERs é verificado separadamente em `tests/rls/security_definer_hardening.sql`.