# public.device_login_notifications

> SINGU: Notificações enviadas em eventos de login anômalos. Trackeia resposta do usuário (trusted/reported_fraud).

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
| 3 | `device_id` | `uuid` | sim |  |  |  |
| 4 | `event_type` | `text` | não |  |  |  |
| 5 | `channel` | `text` | sim |  |  |  |
| 6 | `sent_at` | `timestamp with time zone` | não | `now()` |  |  |
| 7 | `opened_at` | `timestamp with time zone` | sim |  |  |  |
| 8 | `user_action` | `text` | sim |  |  |  |
| 9 | `user_action_at` | `timestamp with time zone` | sim |  |  |  |
| 10 | `details` | `jsonb` | sim | `'{}'::jsonb` |  |  |
| 11 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 12 | `ip_address` | `text` | sim |  |  |  |
| 13 | `location` | `text` | sim |  |  |  |
| 14 | `is_read` | `boolean` | sim | `false` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| device_login_notifications_channel_check | CHECK | `CHECK (channel = ANY (ARRAY['email'::text, 'sms'::text, 'push'::text, 'in_app'::text]))` |  |  | sim |
| device_login_notifications_event_type_check | CHECK | `CHECK (event_type = ANY (ARRAY['new_device'::text, 'new_location'::text, 'unusual_time'::text, 'concurrent_session'::text, 'revoked_device_attempt'::text]))` |  |  | sim |
| device_login_notifications_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| device_login_notifications_user_action_check | CHECK | `CHECK (user_action = ANY (ARRAY['trusted'::text, 'reported_fraud'::text, 'ignored'::text, 'no_action'::text]))` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| device_login_notifications_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX device_login_notifications_pkey ON public.device_login_notifications USING btree (id)` |
| idx_device_login_notifications_user_id | btree | user_id | não | sim |  | `CREATE INDEX idx_device_login_notifications_user_id ON public.device_login_notifications USING btree (user_id)` |


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

### `Users read own device notifications`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(user_id = ( SELECT auth.uid() AS uid))` |
| WITH CHECK | `(user_id = ( SELECT auth.uid() AS uid))` |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
