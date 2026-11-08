# public.access_security_settings

> SINGU: Config de segurança por usuário (MFA, IP whitelist, device trust, password policy, brute force thresholds).

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 5 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `user_id` | `uuid` | não |  |  |  |
| 3 | `require_mfa` | `boolean` | sim | `false` |  |  |
| 4 | `mfa_method` | `text` | sim |  |  |  |
| 5 | `ip_whitelist_enabled` | `boolean` | sim | `false` |  |  |
| 6 | `geo_restriction_enabled` | `boolean` | sim | `false` |  |  |
| 7 | `device_trust_enabled` | `boolean` | sim | `true` |  |  |
| 8 | `session_timeout_minutes` | `integer` | sim | `480` |  |  |
| 9 | `max_concurrent_sessions` | `integer` | sim | `3` |  |  |
| 10 | `password_policy` | `jsonb` | sim | `'{"min_length": 8, "expiry_days": 90, "require_numbers": true, "require_symbols": false, "require_uppercase": true}'::jsonb` |  |  |
| 11 | `brute_force_threshold` | `integer` | sim | `5` |  |  |
| 12 | `brute_force_window_minutes` | `integer` | sim | `15` |  |  |
| 13 | `brute_force_lockout_minutes` | `integer` | sim | `30` |  |  |
| 14 | `notify_on_new_device` | `boolean` | sim | `true` |  |  |
| 15 | `notify_on_new_location` | `boolean` | sim | `true` |  |  |
| 16 | `metadata` | `jsonb` | sim | `'{}'::jsonb` |  |  |
| 17 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 18 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |
| 19 | `enable_ip_restriction` | `boolean` | sim | `false` |  |  |
| 20 | `enable_geo_blocking` | `boolean` | sim | `false` |  |  |
| 21 | `enable_device_detection` | `boolean` | sim | `true` |  |  |
| 22 | `notify_new_device` | `boolean` | sim | `true` |  |  |
| 23 | `max_sessions` | `integer` | sim | `5` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| access_security_settings_mfa_method_check | CHECK | `CHECK (mfa_method = ANY (ARRAY['totp'::text, 'webauthn'::text, 'sms'::text, 'email'::text]))` |  |  | sim |
| access_security_settings_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| access_security_settings_user_id_key | UNIQUE | `UNIQUE (user_id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| access_security_settings_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX access_security_settings_pkey ON public.access_security_settings USING btree (id)` |
| access_security_settings_user_id_key | btree | user_id | sim | sim |  | `CREATE UNIQUE INDEX access_security_settings_user_id_key ON public.access_security_settings USING btree (user_id)` |


## Policies (RLS)

### `Users can delete own`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `Users can insert own`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |

### `Users can update own`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |

### `Users can view own`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `Users manage own security settings`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(user_id = ( SELECT auth.uid() AS uid))` |
| WITH CHECK | `(user_id = ( SELECT auth.uid() AS uid))` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| update_access_security_settings_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

_nenhum_
