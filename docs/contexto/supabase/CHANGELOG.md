# CHANGELOG do snapshot Supabase

Diff semântico gerado a cada coleta em que algo mudou.

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

