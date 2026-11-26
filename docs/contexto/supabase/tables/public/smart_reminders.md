# public.smart_reminders

> Lembretes inteligentes com contexto

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
| usada por views | public.vw_notification_dashboard, public.vw_todays_reminders |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `uuid_generate_v4()` |  |  |
| 2 | `user_id` | `uuid` | não |  |  |  |
| 3 | `reminder_type` | `character varying(50)` | não |  |  |  |
| 4 | `contact_id` | `uuid` | sim |  |  |  |
| 5 | `company_id` | `uuid` | sim |  |  |  |
| 6 | `interaction_id` | `uuid` | sim |  |  |  |
| 7 | `title` | `character varying(255)` | não |  |  |  |
| 8 | `description` | `text` | sim |  |  |  |
| 9 | `remind_at` | `timestamp with time zone` | não |  |  |  |
| 10 | `is_recurring` | `boolean` | sim | `false` |  |  |
| 11 | `recurrence_pattern` | `character varying(50)` | sim |  |  |  |
| 12 | `recurrence_interval` | `integer` | sim | `1` |  |  |
| 13 | `recurrence_end_date` | `date` | sim |  |  |  |
| 14 | `next_occurrence` | `timestamp with time zone` | sim |  |  |  |
| 15 | `advance_notice_minutes` | `integer` | sim | `30` |  |  |
| 16 | `priority` | `character varying(20)` | sim | `'normal'::character varying` |  |  |
| 17 | `context_data` | `jsonb` | sim |  |  |  |
| 18 | `suggested_actions` | `text[]` | sim |  |  |  |
| 19 | `status` | `character varying(20)` | sim | `'pending'::character varying` |  |  |
| 20 | `snoozed_until` | `timestamp with time zone` | sim |  |  |  |
| 21 | `snooze_count` | `integer` | sim | `0` |  |  |
| 22 | `completed_at` | `timestamp with time zone` | sim |  |  |  |
| 23 | `completion_notes` | `text` | sim |  |  |  |
| 24 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 25 | `updated_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| smart_reminders_company_id_fkey | FOREIGN KEY | `FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| smart_reminders_contact_id_fkey | FOREIGN KEY | `FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| smart_reminders_interaction_id_fkey | FOREIGN KEY | `FOREIGN KEY (interaction_id) REFERENCES interactions(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| smart_reminders_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| smart_reminders_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| smart_reminders_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX smart_reminders_pkey ON public.smart_reminders USING btree (id)` |


## Policies (RLS)

### `service_role_full_smart_reminders`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | service_role |
| USING | `true` |
| WITH CHECK | `true` |

### `smart_reminders_owner_access`

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
