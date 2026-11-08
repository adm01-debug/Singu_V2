# public.password_reset_requests

> SINGU: Tokens de reset de senha (armazenados como hash). Single-use com expiração.

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
| 3 | `email` | `text` | não |  |  |  |
| 4 | `token_hash` | `text` | não |  |  |  |
| 5 | `ip_address` | `inet` | sim |  |  |  |
| 6 | `user_agent` | `text` | sim |  |  |  |
| 7 | `requested_at` | `timestamp with time zone` | não | `now()` |  |  |
| 8 | `expires_at` | `timestamp with time zone` | não |  |  |  |
| 9 | `used_at` | `timestamp with time zone` | sim |  |  |  |
| 10 | `is_used` | `boolean` | sim | `false` |  |  |
| 11 | `is_revoked` | `boolean` | sim | `false` |  |  |
| 12 | `attempt_count` | `integer` | sim | `0` |  |  |
| 13 | `metadata` | `jsonb` | sim | `'{}'::jsonb` |  |  |
| 14 | `status` | `text` | não | `'pending'::text` |  |  |
| 15 | `approved_by` | `uuid` | sim |  |  |  |
| 16 | `reason` | `text` | sim |  |  |  |
| 17 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 18 | `resolved_at` | `timestamp with time zone` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| chk_password_reset_requests_status | CHECK | `CHECK (status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text, 'expired'::text]))` |  |  | sim |
| password_reset_requests_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| password_reset_requests_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX password_reset_requests_pkey ON public.password_reset_requests USING btree (id)` |


## Policies (RLS)

### `Admins manage reset requests`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)` |
| WITH CHECK | `has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)` |

### `Users read own reset requests`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(user_id = ( SELECT auth.uid() AS uid))` |
| WITH CHECK |  |

### `password_reset_requests_internal_deny_all`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | RESTRICTIVE |
| roles | anon, authenticated |
| USING | `false` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
