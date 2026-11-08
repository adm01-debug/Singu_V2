# CHANGELOG do snapshot Supabase

Diff semântico gerado a cada coleta em que algo mudou.

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

