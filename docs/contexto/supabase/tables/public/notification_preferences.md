# public.notification_preferences

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
| 1 | `user_id` | `uuid` | não |  |  |  |
| 2 | `quiet_hours_start` | `smallint` | não | `22` |  |  |
| 3 | `quiet_hours_end` | `smallint` | não | `8` |  |  |
| 4 | `weekend_silence` | `boolean` | não | `false` |  |  |
| 5 | `enabled_channels` | `text[]` | não | `ARRAY['in_app'::text]` |  |  |
| 6 | `min_urgency_email` | `text` | não | `'high'::text` |  |  |
| 7 | `min_urgency_push` | `text` | não | `'critical'::text` |  |  |
| 8 | `digest_mode` | `text` | não | `'immediate'::text` |  |  |
| 9 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 10 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| notification_preferences_digest_mode_check | CHECK | `CHECK (digest_mode = ANY (ARRAY['immediate'::text, 'hourly'::text, 'daily'::text]))` |  |  | sim |
| notification_preferences_pkey | PRIMARY KEY | `PRIMARY KEY (user_id)` |  |  | sim |
| notification_preferences_quiet_hours_end_check | CHECK | `CHECK (quiet_hours_end >= 0 AND quiet_hours_end <= 23)` |  |  | sim |
| notification_preferences_quiet_hours_start_check | CHECK | `CHECK (quiet_hours_start >= 0 AND quiet_hours_start <= 23)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| notification_preferences_pkey | btree | user_id | sim | sim |  | `CREATE UNIQUE INDEX notification_preferences_pkey ON public.notification_preferences USING btree (user_id)` |


## Policies (RLS)

### `self read prefs`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `self update prefs`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `self upsert prefs`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| trg_notif_prefs_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
