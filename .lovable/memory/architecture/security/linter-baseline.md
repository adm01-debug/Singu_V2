---
name: Supabase Linter Baseline
description: Baseline de findings do supabase linter aceitos com justificativa. Zero CRITICAL/HIGH; 12 WARNs documentados (3 infra + 4 endpoints públicos token/slug + has_role RBAC helper).
type: constraint
---
**Atualizada na Rodada 42/10 — Onda G Bucket B (lote 8, encerramento).**
**Resultado atual:** 0 CRITICAL, 0 HIGH, **12 WARN** (piso operacional).

**Rodada 42/10 (encerramento):** auditoria confirmou que os 12 WARN restantes representam o **piso arquitetural** — não podem ser removidos sem quebrar contratos públicos ou reestruturar RLS crítica. Ratchet travado em `BASELINE = 12` (`scripts/check-backend-linter-baseline.mjs`).

**Rodada 41/10:** RLS por `share_token` implementado nos Deal Rooms; `get_deal_room_by_token`, `record_buyer_view`, `get_buyer_document_path` convertidos DEFINER → INVOKER (18 → 12).

**Rodada 40/10:** `increment_form_view`, `increment_magnet_view` convertidos DEFINER → INVOKER com grant column-level em `view_count` (22 → 18).

**Rodada 39/10:** `cleanup_behavioral_regen_queue`, `execute_readonly_query` convertidos DEFINER → INVOKER com guards `has_role('admin')` (24 → 22).

**Rodada 38/10:** `increment_webhook_quota`, `move_deal_atomic` (integer e numeric), `publish_mtta_sla_breach_alert`, `reset_daily_lead_counts` convertidas DEFINER → INVOKER. Adicionada policy `Admins can insert system alerts` em `system_alerts`. RLS de `deals`, `connection_quotas`, `sales_team_members` passa a valer no caller; edge functions `incoming-webhook` e `lead-routing` continuam via service_role.

**Rodada 37/10:** `dismiss_revops_alert`, `compute_attribution`, `enroll_contact_in_workflow`, `get_connection_metrics` convertidas DEFINER → INVOKER. Guards de `auth.uid()`/`has_role` preservados; adicionado guard `auth.uid() IS NOT NULL` em `enroll_contact_in_workflow`. RLS de `revops_alerts`, `attribution_touchpoints`, `attribution_models_cache`, `nurturing_executions`, `nurturing_workflows` e `connection_test_logs` passa a valer no caller.

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

## Endpoints públicos — `anon`+`authenticated` EXECUTE (4 funções × 2 papéis = 8 WARN)
Capturas públicas por **token opaco** ou **slug publicado**. Não podem virar INVOKER sem grants amplos de INSERT/UPDATE a `anon` em múltiplas tabelas owner-scoped (deal_room_comments, deal_room_activities, deal_room_milestones, form_submissions, forms, attribution_touchpoints, lead_magnet_downloads), o que teria superfície de ataque maior que o WARN. Todas com `SET search_path=public, pg_temp`, validação server-side (length, published flags, share_enabled) e escrita restrita ao owner derivado do token/slug.

| Função | Auth vector |
|--------|-------------|
| `buyer_add_comment(_token, _body, _label)` | `deal_rooms.share_token` + `share_enabled=true` |
| `buyer_toggle_milestone(_token, _milestone_id, _done, _label)` | idem + `owner_side != 'seller'` |
| `submit_public_form(_slug, _data, _utms, _page_url, _user_agent)` | `forms.slug` + `is_published=true` |
| `track_magnet_download(_slug, _email, _name, _utms)` | `lead_magnets.slug` + `is_published=true` |

## RBAC helper (1 função × 1 papel = 1 WARN)

| Função | Justificativa |
|--------|---------------|
| `has_role(_user_id, _role)` (authenticated) | Helper `SECURITY DEFINER` chamado por **toda policy RLS** que faz gating por papel. Converter para INVOKER exigiria grant de SELECT em `user_roles` para `authenticated`, quebrando o isolamento anti-recursão documentado em `<user-roles>`. Design correto. |

## Reduções da Rodada 32/10
- **7 REVOKE FROM anon:** `check_behavioral_regen_cron_staleness`, `cleanup_behavioral_regen_queue`, `cleanup_simulated_alerts`, `enqueue_behavioral_profile_regen`, `get_behavioral_regen_cron_health`, `notify_admins_on_critical_behavioral_alert`, `simulate_behavioral_regen_alert`.
- **33 REVOKE FROM authenticated (triggers):** todos os `audit_*`, `process_*_audit`, `notify_*`, `log_*`, `sync_*`, `enqueue_*` (triggers disparam via table owner).
- **23 REVOKE FROM authenticated (internos):** `_connection_encryption_key`, `encrypt/decrypt_connection_config`, `aggregate_nlp_to_company`, `enqueue_smart_notification`, `ensure_audit_log_partition`, `cleanup_old_health_snapshots`, `search_*_semantic` variantes, `seed_deal_room`, `seed_playbook_defaults`, `seed_win_loss_defaults`, `update_deal_amount`, `move_deal` (legado — o app usa `move_deal_atomic`), etc. Todos chamados por edge functions com `service_role` ou por cron.

**Política (ADR-022):** novo CRITICAL/HIGH bloqueia deploy. Novo WARN precisa ser anexado a esta tabela com justificativa ou corrigido. Ratchet enforçado por `scripts/check-backend-linter-baseline.mjs` (`BASELINE = 12`).

**Revalidação:** `supabase--linter` (sem argumentos). Baseline atual: **12 WARN** (piso arquitetural — Rodada 42/10).
