# public.smart_notifications

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 4 |
| realtime (publication) | sim |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `user_id` | `uuid` | não |  |  |  |
| 3 | `event_type` | `text` | não |  |  |  |
| 4 | `entity_type` | `text` | sim |  |  |  |
| 5 | `entity_id` | `text` | sim |  |  |  |
| 6 | `title` | `text` | não |  |  |  |
| 7 | `body` | `text` | sim |  |  |  |
| 8 | `payload` | `jsonb` | não | `'{}'::jsonb` |  |  |
| 9 | `urgency` | `text` | não | `'normal'::text` |  |  |
| 10 | `decided_channel` | `text` | não | `'in_app'::text` |  |  |
| 11 | `decision_reason` | `text` | sim |  |  |  |
| 12 | `bundle_key` | `text` | sim |  |  |  |
| 13 | `bundle_count` | `integer` | não | `1` |  |  |
| 14 | `status` | `text` | não | `'pending'::text` |  |  |
| 15 | `scheduled_for` | `timestamp with time zone` | não | `now()` |  |  |
| 16 | `delivered_at` | `timestamp with time zone` | sim |  |  |  |
| 17 | `dismissed_at` | `timestamp with time zone` | sim |  |  |  |
| 18 | `clicked_at` | `timestamp with time zone` | sim |  |  |  |
| 19 | `snoozed_until` | `timestamp with time zone` | sim |  |  |  |
| 20 | `action_url` | `text` | sim |  |  |  |
| 21 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| smart_notifications_decided_channel_check | CHECK | `CHECK (decided_channel = ANY (ARRAY['in_app'::text, 'email'::text, 'push'::text, 'whatsapp'::text, 'suppressed'::text]))` |  |  | sim |
| smart_notifications_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| smart_notifications_status_check | CHECK | `CHECK (status = ANY (ARRAY['pending'::text, 'delivered'::text, 'dismissed'::text, 'clicked'::text, 'suppressed'::text, 'snoozed'::text]))` |  |  | sim |
| smart_notifications_urgency_check | CHECK | `CHECK (urgency = ANY (ARRAY['critical'::text, 'high'::text, 'normal'::text, 'low'::text]))` |  |  | sim |
| smart_notifications_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_smart_notif_bundle | btree | user_id, bundle_key, created_at | não | sim | `(bundle_key IS NOT NULL)` | `CREATE INDEX idx_smart_notif_bundle ON public.smart_notifications USING btree (user_id, bundle_key, created_at DESC) WHERE (bundle_key IS NOT NULL)` |
| idx_smart_notif_urgency | btree | user_id, urgency, status | não | sim |  | `CREATE INDEX idx_smart_notif_urgency ON public.smart_notifications USING btree (user_id, urgency, status)` |
| idx_smart_notif_user_status | btree | user_id, status, scheduled_for | não | sim |  | `CREATE INDEX idx_smart_notif_user_status ON public.smart_notifications USING btree (user_id, status, scheduled_for DESC)` |
| smart_notifications_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX smart_notifications_pkey ON public.smart_notifications USING btree (id)` |


## Policies (RLS)

### `self delete notif`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `self insert notif`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |

### `self read notif`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `self update notif`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
