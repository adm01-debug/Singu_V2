# public.access_blocked_log

> SINGU: Log append-only de bloqueios de acesso (brute force, IP, geo, device). Base para dashboards de segurança.

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 3 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `user_id` | `uuid` | sim |  |  |  |
| 3 | `email` | `text` | sim |  |  |  |
| 4 | `ip_address` | `inet` | sim |  |  |  |
| 5 | `block_reason` | `text` | não |  |  |  |
| 6 | `reason_details` | `text` | sim |  |  |  |
| 7 | `country` | `text` | sim |  |  |  |
| 8 | `city` | `text` | sim |  |  |  |
| 9 | `user_agent` | `text` | sim |  |  |  |
| 10 | `attempted_endpoint` | `text` | sim |  |  |  |
| 11 | `blocked_until` | `timestamp with time zone` | sim |  |  |  |
| 12 | `is_resolved` | `boolean` | sim | `false` |  |  |
| 13 | `resolved_at` | `timestamp with time zone` | sim |  |  |  |
| 14 | `metadata` | `jsonb` | sim | `'{}'::jsonb` |  |  |
| 15 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 16 | `country_code` | `text` | sim |  |  |  |
| 17 | `reason` | `text` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| access_blocked_log_block_reason_check | CHECK | `CHECK (block_reason = ANY (ARRAY['brute_force'::text, 'ip_not_whitelisted'::text, 'country_blocked'::text, 'device_not_trusted'::text, 'rate_limit'::text, 'suspicious_pattern'::text, 'admin_block'::text, 'other'::text]))` |  |  | sim |
| access_blocked_log_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| access_blocked_log_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX access_blocked_log_pkey ON public.access_blocked_log USING btree (id)` |


## Policies (RLS)

### `Admins read blocked logs`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)` |
| WITH CHECK |  |

### `access_blocked_log_internal_deny_all`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | RESTRICTIVE |
| roles | anon, authenticated |
| USING | `false` |
| WITH CHECK |  |

### `service_role_inserts_access_blocked_log`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `false` |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
