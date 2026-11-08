# public.user_known_devices

> SINGU: Dispositivos conhecidos por usuário. Trust flag permite bypass de verificações extras. Revoke imediato em caso de comprometimento.

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
| 3 | `device_fingerprint` | `text` | não |  |  |  |
| 4 | `device_name` | `text` | sim |  |  |  |
| 5 | `device_type` | `text` | sim |  |  |  |
| 6 | `os` | `text` | sim |  |  |  |
| 7 | `browser` | `text` | sim |  |  |  |
| 8 | `first_seen_at` | `timestamp with time zone` | não | `now()` |  |  |
| 9 | `last_seen_at` | `timestamp with time zone` | não | `now()` |  |  |
| 10 | `login_count` | `integer` | sim | `1` |  |  |
| 11 | `is_trusted` | `boolean` | sim | `false` |  |  |
| 12 | `trusted_at` | `timestamp with time zone` | sim |  |  |  |
| 13 | `is_revoked` | `boolean` | sim | `false` |  |  |
| 14 | `revoked_at` | `timestamp with time zone` | sim |  |  |  |
| 15 | `metadata` | `jsonb` | sim | `'{}'::jsonb` |  |  |
| 16 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 17 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |
| 18 | `last_used_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| unique_user_device | UNIQUE | `UNIQUE (user_id, device_fingerprint)` |  |  | sim |
| user_known_devices_device_type_check | CHECK | `CHECK (device_type = ANY (ARRAY['desktop'::text, 'mobile'::text, 'tablet'::text, 'bot'::text, 'unknown'::text]))` |  |  | sim |
| user_known_devices_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| user_known_devices_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| unique_user_device | btree | user_id, device_fingerprint | sim | sim |  | `CREATE UNIQUE INDEX unique_user_device ON public.user_known_devices USING btree (user_id, device_fingerprint)` |
| user_known_devices_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX user_known_devices_pkey ON public.user_known_devices USING btree (id)` |


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

### `Users manage own devices`

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
| update_user_known_devices_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

_nenhum_
