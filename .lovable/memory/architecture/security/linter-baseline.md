---
name: Supabase Linter Baseline
description: Baseline de findings do supabase linter aceitos com justificativa. Zero CRITICAL/HIGH; 36 WARNs documentados (3 infra + 9 endpoints públicos anon + 24 RPCs para authenticated).
type: constraint
---
**Atualizada na Rodada 36/10 — Onda G Bucket B (lote 4).**
**Resultado atual:** 0 CRITICAL, 0 HIGH, **33 WARN**.

**Rodada 36/10:** `compute_revops_kpis`, `compute_account_health`, `evaluate_mql` convertidas DEFINER → INVOKER. Guards de `auth.uid()` mantidos/reforçados; RLS das tabelas de RevOps, CS e MQL valem no caller.

**Rodada 35/10:** `seed_lead_score_defaults`, `seed_conversation_topics`, `seed_forecast_period` convertidos DEFINER → INVOKER. Cada função guarda `auth.uid() = _user_id` e RLS de `lead_score_thresholds`, `lead_score_rules`, `conversation_topics_catalog`, `forecast_periods`, `forecast_quota_settings` aplica-se ao caller.

**Rodada 33/10 (Onda G Bucket B parcial):** `search_companies_unaccent`, `search_contacts_unaccent`, `search_interactions_unaccent`, `search_products_semantic` convertidos DEFINER → INVOKER. RLS passa a valer na sessão do caller; `search_path` inclui `extensions` para pg_trgm.

**Rodada 34/10 (Onda G Bucket B lote 2):** `get_score_explicability`, `cs_renewal_pipeline`, `get_marketing_funnel_stats` convertidos DEFINER → INVOKER. Todas leem tabelas com RLS por `user_id`/`contact_id`; RPCs que aceitam `_user_id` cross-checam contra `auth.uid()` antes de executar.

## Infra (3)
| # | Lint | Justificativa |
|---|------|---------------|
| 1 | `0014_extension_in_public` (`pg_net`) | Extensão oficial Supabase; `SET SCHEMA` não suportado (`0A000`). Sem superfície de ataque exposta. |
| 2 | `0025_public_bucket_allows_listing` (`company-logos`) | Bucket público intencional; RLS de upload owner-only em `{userId}/{companyId}/`. |
| 3 | `0025_public_bucket_allows_listing` (assets públicos) | Idem — UI não autenticada. |

## Endpoints públicos — `anon` EXECUTE mantido (9)
Buyer portal, landing pages, forms e magnets — consumidos por rotas sem sessão. Todos com `SET search_path=public, pg_temp` e validação server-side.

`buyer_add_comment`, `buyer_toggle_milestone`, `get_buyer_document_path`, `get_deal_room_by_token`, `record_buyer_view`, `submit_public_form`, `track_magnet_download`, `increment_form_view`, `increment_magnet_view`.

## RPCs autenticados — `authenticated` EXECUTE mantido (34)
Chamados via `supabase.rpc()` no client autenticado. Cada função valida `auth.uid()` ou recebe `_user_id`/`p_user_id` cross-checado contra `auth.uid()`.

- **RBAC/utilitários:** `has_role`, `increment_webhook_quota`, `reset_daily_lead_counts`.
- **Deals & Forecast:** `move_deal_atomic` (2 overloads), `dismiss_revops_alert`, `compute_attribution`, `compute_revops_kpis`, `publish_mtta_sla_breach_alert`.
- **Contas & CS:** `compute_account_health`, `evaluate_mql`, `enroll_contact_in_workflow`.
- **Lead scoring:** `seed_lead_score_defaults`.
- **Connections:** `get_connection_metrics`.
- **Busca:** `search_companies_unaccent`, `search_contacts_unaccent`, `search_interactions_unaccent`, `search_products_semantic`.
- **Seeds/Setup:** `seed_conversation_topics`, `seed_forecast_period`.
- **Buyer portal (anon-shared):** `buyer_add_comment`, `buyer_toggle_milestone`, `get_buyer_document_path`, `get_deal_room_by_token`, `record_buyer_view`, `submit_public_form`, `track_magnet_download`, `increment_form_view`, `increment_magnet_view`.
- **Manutenção pipeline comportamental:** `cleanup_behavioral_regen_queue` (chamada por admin UI).
- **Read-only bridge:** `execute_readonly_query` (validação de whitelist embutida no corpo da função).

## Reduções da Rodada 32/10
- **7 REVOKE FROM anon:** `check_behavioral_regen_cron_staleness`, `cleanup_behavioral_regen_queue`, `cleanup_simulated_alerts`, `enqueue_behavioral_profile_regen`, `get_behavioral_regen_cron_health`, `notify_admins_on_critical_behavioral_alert`, `simulate_behavioral_regen_alert`.
- **33 REVOKE FROM authenticated (triggers):** todos os `audit_*`, `process_*_audit`, `notify_*`, `log_*`, `sync_*`, `enqueue_*` (triggers disparam via table owner).
- **23 REVOKE FROM authenticated (internos):** `_connection_encryption_key`, `encrypt/decrypt_connection_config`, `aggregate_nlp_to_company`, `enqueue_smart_notification`, `ensure_audit_log_partition`, `cleanup_old_health_snapshots`, `search_*_semantic` variantes, `seed_deal_room`, `seed_playbook_defaults`, `seed_win_loss_defaults`, `update_deal_amount`, `move_deal` (legado — o app usa `move_deal_atomic`), etc. Todos chamados por edge functions com `service_role` ou por cron.

**Política (ADR-022):** novo WARN CRITICAL/HIGH bloqueia deploy. Novo WARN precisa ser anexado a esta tabela com justificativa ou corrigido. Ratchet enforçado por `scripts/check-backend-linter-baseline.mjs`.

**Revalidação:** `supabase--linter` (sem argumentos). Baseline atual: **36 WARN**.
