# public.reminders

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
| 2 | `company_id` | `uuid` | sim |  |  |  |
| 3 | `user_id` | `uuid` | não |  |  |  |
| 4 | `title` | `text` | não |  |  |  |
| 5 | `reminder_date` | `timestamp with time zone` | não |  |  |  |
| 6 | `reminder_type` | `text` | sim | `'general'::text` |  |  |
| 7 | `notes` | `text` | sim |  |  |  |
| 8 | `priority` | `text` | sim | `'medium'::text` |  |  |
| 9 | `is_completed` | `boolean` | sim | `false` |  |  |
| 10 | `completed_at` | `timestamp with time zone` | sim |  |  |  |
| 11 | `snoozed_until` | `timestamp with time zone` | sim |  |  |  |
| 12 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| chk_reminders_priority | CHECK | `CHECK (priority = ANY (ARRAY['alta'::text, 'media'::text, 'baixa'::text, 'urgente'::text]))` |  |  | sim |
| reminders_company_id_fkey | FOREIGN KEY | `FOREIGN KEY (company_id) REFERENCES companies(id)` | NO ACTION | NO ACTION | sim |
| reminders_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| reminders_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES profiles(id)` | NO ACTION | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_reminders_company | btree | company_id | não | sim |  | `CREATE INDEX idx_reminders_company ON public.reminders USING btree (company_id)` |
| idx_reminders_user_date | btree | user_id, reminder_date | não | sim |  | `CREATE INDEX idx_reminders_user_date ON public.reminders USING btree (user_id, reminder_date)` |
| idx_reminders_user_id | btree | user_id | não | sim |  | `CREATE INDEX idx_reminders_user_id ON public.reminders USING btree (user_id)` |
| reminders_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX reminders_pkey ON public.reminders USING btree (id)` |


## Policies (RLS)

### `reminders_delete`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `reminders_insert`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |

### `reminders_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `reminders_select_admin`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)` |
| WITH CHECK |  |

### `reminders_update`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
