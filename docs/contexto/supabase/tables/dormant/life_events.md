# _dormant.life_events

> SINGU: Eventos de vida importantes dos contatos

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 1 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `user_id` | `uuid` | sim |  |  |  |
| 3 | `contact_id` | `uuid` | não |  |  |  |
| 4 | `event_type` | `text` | não |  |  |  |
| 5 | `title` | `text` | não |  |  |  |
| 6 | `description` | `text` | sim |  |  |  |
| 7 | `event_date` | `date` | sim |  |  |  |
| 8 | `is_recurring` | `boolean` | sim | `false` |  |  |
| 9 | `recurring_type` | `text` | sim |  |  |  |
| 10 | `reminder_days_before` | `integer[]` | sim | `'{7,1}'::integer[]` |  |  |
| 11 | `suggested_action` | `text` | sim |  |  |  |
| 12 | `suggested_message` | `text` | sim |  |  |  |
| 13 | `discovered_via` | `text` | sim |  |  |  |
| 14 | `is_private` | `boolean` | sim | `false` |  |  |
| 15 | `is_verified` | `boolean` | sim | `false` |  |  |
| 16 | `last_action_date` | `date` | sim |  |  |  |
| 17 | `last_action_type` | `text` | sim |  |  |  |
| 18 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 19 | `updated_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| life_events_contact_id_fkey | FOREIGN KEY | `FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| life_events_discovered_via_check | CHECK | `CHECK (discovered_via = ANY (ARRAY['manual'::text, 'conversation'::text, 'social_media'::text, 'linkedin'::text, 'imported'::text]))` |  |  | sim |
| life_events_event_type_check | CHECK | `CHECK (event_type = ANY (ARRAY['birthday'::text, 'work_anniversary'::text, 'promotion'::text, 'job_change'::text, 'company_change'::text, 'wedding'::text, 'child_birth'::text, 'graduation'::text, 'achievement'::text, 'loss'::text, 'relocation'::text, 'retirement'::text, 'health_issue'::text, 'vacation'::text, 'holiday'::text, 'custom'::text]))` |  |  | sim |
| life_events_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| life_events_recurring_type_check | CHECK | `CHECK (recurring_type = ANY (ARRAY['yearly'::text, 'monthly'::text, 'custom'::text]))` |  |  | sim |
| life_events_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| life_events_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX life_events_pkey ON _dormant.life_events USING btree (id)` |


## Policies (RLS)

### `dormant_deny_all_life_events`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | RESTRICTIVE |
| roles | public |
| USING | `false` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

_nenhum_
