# CHANGELOG do snapshot Supabase

Diff semântico gerado a cada coleta em que algo mudou.

## 2026-11-14 01:13 UTC

- **realtime** adicionado (1): `supabase_realtime_messages_publication:realtime.messages_2026_11_17`
- **realtime** removido (1): `supabase_realtime_messages_publication:realtime.messages_2026_11_10`

## 2026-11-13 21:45 UTC

- **functions** alterado (1): `public.check_mtta_auto_ack_heartbeat()`

## 2026-11-13 00:50 UTC

- **realtime** adicionado (1): `supabase_realtime_messages_publication:realtime.messages_2026_11_16`
- **realtime** removido (1): `supabase_realtime_messages_publication:realtime.messages_2026_11_09`

## 2026-11-12 02:34 UTC

- **cron jobs** alterado (1): `2457:singu-edge-weekly-digest`
- **functions** alterado (4): `public.auto_ack_stale_mtta_sla_breaches()`, `public.check_contact_health_alerts()`, `public.check_mtta_auto_ack_heartbeat()`, `public.cleanup_simulated_alerts()`
- **migrations** adicionado (1): `20261112001000_weekly_digest_cron_horario`

## 2026-11-12 01:49 UTC

- **cron jobs** adicionado (19): `2444:singu-edge-validation-queue-worker`, `2445:singu-edge-process-webhook-dlq`, `2446:singu-edge-sequence-processor`, `2447:singu-edge-nurturing-runner`, `2448:singu-edge-check-notifications`, `2449:singu-edge-check-health-alerts`, `2450:singu-edge-mql-evaluator`, `2451:singu-edge-revops-snapshot-builder`, `2452:singu-edge-lead-score-cron`, `2453:singu-edge-cs-health-recalc`, `2454:singu-edge-forecast-snapshot-cron`, `2455:singu-edge-client-notifications`, `2456:singu-edge-template-success-notifications`, `2457:singu-edge-weekly-digest`, `2458:check-contact-health-daily`, `2459:mtta-sla-breach-auto-ack-hourly`, `2460:mtta-auto-ack-heartbeat-watchdog`, `2461:cleanup-simulated-alerts-weekly`, `2462:revalidate-stale-emails`
- **functions** adicionado (1): `public.increment_workflow_completed(_id uuid)`
- **functions** alterado (4): `public.auto_ack_stale_mtta_sla_breaches()`, `public.check_contact_health_alerts()`, `public.check_mtta_auto_ack_heartbeat()`, `public.cleanup_simulated_alerts()`
- **migrations** adicionado (2): `20261111210500_agenda_edge_functions_cron`, `20261111233000_reagenda_rotinas_sql_e_rpc_nurturing`
- **vault secrets (nomes)** adicionado (1): `singu_cron_secret`

## 2026-11-12 00:58 UTC

- **realtime** adicionado (1): `supabase_realtime_messages_publication:realtime.messages_2026_11_15`
- **realtime** removido (1): `supabase_realtime_messages_publication:realtime.messages_2026_11_08`

## 2026-11-11 13:55 UTC

- **cron jobs** adicionado (1): `858:cleanup_cron_job_run_details_daily`
- **functions** adicionado (1): `public.cleanup_cron_job_run_details(_dias integer)`

## 2026-11-11 01:16 UTC

- **realtime** adicionado (1): `supabase_realtime_messages_publication:realtime.messages_2026_11_14`
- **realtime** removido (1): `supabase_realtime_messages_publication:realtime.messages_2026_11_07`

## 2026-11-10 22:14 UTC

- **functions** removido (1): `public.update_company_fields(p_company_id uuid, p_data jsonb)`

## 2026-11-10 19:59 UTC

- **realtime** removido (1): `supabase_realtime_messages_publication:realtime.messages_2026_11_06`

## 2026-11-10 18:49 UTC

- **realtime** adicionado (1): `supabase_realtime_messages_publication:realtime.messages_2026_11_13`

## 2026-11-10 01:05 UTC

- **functions** alterado (4): `public.fn_cf_collect_sm_legacy_dispatch(p_start_page integer, p_end_page integer)`, `public.get_unified_communication_history(p_company_id uuid, p_limit integer)`, `public.has_role(_user_id uuid, _role app_role)`, `public.immutable_unaccent(text)`
- **migrations** alterado (1): `20260607211026_fn_cf_collect_sm_legacy_v2_async`

## 2026-11-09 04:22 UTC

- **functions** alterado (1): `public.merge_records_atomically(p_entity text, p_primary_id uuid, p_secondary_id uuid, p_field_overrides jsonb)`
- **migrations** adicionado (1): `20261109010329_fix_merge_nome_crm_override`
- **realtime** adicionado (1): `supabase_realtime_messages_publication:realtime.messages_2026_11_12`
- **realtime** removido (1): `supabase_realtime_messages_publication:realtime.messages_2026_11_05`

## 2026-11-08 21:48 UTC

- **functions** alterado (3): `public.get_birthday_contacts(p_days_ahead integer)`, `public.get_duplicate_contacts(p_limit integer)`, `public.set_updated_at()`

## 2026-11-08 20:48 UTC

- **functions** alterado (1): `public.set_updated_at()`
- **indexes** adicionado (2): `public.idx_contact_emails_primary`, `public.idx_contact_phones_primary`
- **migrations** adicionado (1): `20261108203932_fix_contact_phones_trigger_primary_indexes`
- **triggers** removido (1): `public.contact_phones.set_updated_at`

## 2026-11-08 19:57 UTC

- **functions** alterado (1): `public.merge_records_atomically(p_entity text, p_primary_id uuid, p_secondary_id uuid, p_field_overrides jsonb)`

## 2026-11-08 18:49 UTC

- **functions** alterado (1): `public.cleanup_rpc_perf_samples()`

## 2026-11-08 17:36 UTC

- **grants** adicionado (1899): `_dormant.access_denied_logs:anon`, `_dormant.access_denied_logs:authenticated`, `_dormant.access_denied_logs:service_role`, `_dormant.active_power_ups:anon`, `_dormant.active_power_ups:authenticated`, `_dormant.active_power_ups:service_role`, `_dormant.active_sessions:anon`, `_dormant.active_sessions:authenticated`, `_dormant.active_sessions:service_role`, `_dormant.activity_goals:anon`, `_dormant.activity_goals:authenticated`, `_dormant.activity_goals:service_role`, `_dormant.activity_log:anon`, `_dormant.activity_log:authenticated`, `_dormant.activity_log:service_role`, `_dormant.alert_log:anon`, `_dormant.alert_log:authenticated`, `_dormant.alert_log:service_role`, `_dormant.alertas_inativacao:anon`, `_dormant.alertas_inativacao:authenticated`, `_dormant.alertas_inativacao:service_role`, `_dormant.api_usage_log:anon`, `_dormant.api_usage_log:authenticated`, `_dormant.api_usage_log:service_role`, `_dormant.automation_logs:anon`, `_dormant.automation_logs:authenticated`, `_dormant.automation_logs:service_role`, `_dormant.automation_rules:anon`, `_dormant.automation_rules:authenticated`, `_dormant.automation_rules:service_role`, `_dormant.available_spins:anon`, `_dormant.available_spins:authenticated`, `_dormant.available_spins:service_role`, `_dormant.battle_participants:anon`, `_dormant.battle_participants:authenticated`, `_dormant.battle_participants:service_role`, `_dormant.bitrix24_sync_logs:anon`, `_dormant.bitrix24_sync_logs:authenticated`, `_dormant.bitrix24_sync_logs:service_role`, `_dormant.blocked_ips:anon` … (+1859)

## 2026-11-08 15:48 UTC

- Snapshot inicial.

