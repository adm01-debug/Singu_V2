# public.notification_settings

> Configurações de notificação por usuário

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 2 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |
| usada por views | public.vw_notification_dashboard |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `uuid_generate_v4()` |  |  |
| 2 | `user_id` | `uuid` | não |  |  |  |
| 3 | `email_enabled` | `boolean` | sim | `true` |  |  |
| 4 | `push_enabled` | `boolean` | sim | `true` |  |  |
| 5 | `sms_enabled` | `boolean` | sim | `false` |  |  |
| 6 | `whatsapp_enabled` | `boolean` | sim | `false` |  |  |
| 7 | `in_app_enabled` | `boolean` | sim | `true` |  |  |
| 8 | `daily_digest_enabled` | `boolean` | sim | `true` |  |  |
| 9 | `daily_digest_time` | `time without time zone` | sim | `'08:00:00'::time without time zone` |  |  |
| 10 | `weekly_digest_enabled` | `boolean` | sim | `true` |  |  |
| 11 | `weekly_digest_day` | `integer` | sim | `1` |  |  |
| 12 | `weekly_digest_time` | `time without time zone` | sim | `'09:00:00'::time without time zone` |  |  |
| 13 | `notify_follow_up_due` | `boolean` | sim | `true` |  |  |
| 14 | `notify_meeting_reminder` | `boolean` | sim | `true` |  |  |
| 15 | `notify_deal_stage_change` | `boolean` | sim | `true` |  |  |
| 16 | `notify_contact_birthday` | `boolean` | sim | `true` |  |  |
| 17 | `notify_inactivity_alert` | `boolean` | sim | `true` |  |  |
| 18 | `notify_churn_risk` | `boolean` | sim | `true` |  |  |
| 19 | `notify_closing_opportunity` | `boolean` | sim | `true` |  |  |
| 20 | `notify_new_lead` | `boolean` | sim | `true` |  |  |
| 21 | `notify_task_assigned` | `boolean` | sim | `true` |  |  |
| 22 | `notify_mention` | `boolean` | sim | `true` |  |  |
| 23 | `quiet_hours_enabled` | `boolean` | sim | `true` |  |  |
| 24 | `quiet_hours_start` | `time without time zone` | sim | `'20:00:00'::time without time zone` |  |  |
| 25 | `quiet_hours_end` | `time without time zone` | sim | `'08:00:00'::time without time zone` |  |  |
| 26 | `work_days` | `integer[]` | sim | `ARRAY[1, 2, 3, 4, 5]` |  |  |
| 27 | `timezone` | `character varying(50)` | sim | `'America/Sao_Paulo'::character varying` |  |  |
| 28 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 29 | `updated_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| notification_settings_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| notification_settings_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_notif_settings_user | btree | user_id | sim | sim |  | `CREATE UNIQUE INDEX idx_notif_settings_user ON public.notification_settings USING btree (user_id)` |
| notification_settings_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX notification_settings_pkey ON public.notification_settings USING btree (id)` |


## Policies (RLS)

### `notification_settings_owner_access`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(user_id = ( SELECT auth.uid() AS uid))` |
| WITH CHECK | `(user_id = ( SELECT auth.uid() AS uid))` |

### `service_role_full_notification_settings`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | service_role |
| USING | `true` |
| WITH CHECK | `true` |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
