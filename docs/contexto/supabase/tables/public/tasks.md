# public.tasks

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 4 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |
| usada por views | reporting.mv_daily_stats |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `user_id` | `uuid` | não |  |  |  |
| 3 | `company_id` | `uuid` | sim |  |  |  |
| 4 | `contact_id` | `uuid` | sim |  |  |  |
| 5 | `deal_id` | `uuid` | sim |  |  |  |
| 6 | `title` | `text` | não |  |  |  |
| 7 | `description` | `text` | sim |  |  |  |
| 8 | `task_type` | `text` | sim | `'todo'::text` |  |  |
| 9 | `priority` | `text` | sim | `'medium'::text` |  |  |
| 10 | `due_date` | `date` | sim |  |  |  |
| 11 | `due_time` | `time without time zone` | sim |  |  |  |
| 12 | `status` | `text` | sim | `'pending'::text` |  |  |
| 13 | `completed_at` | `timestamp with time zone` | sim |  |  |  |
| 14 | `recurrence` | `text` | sim |  |  |  |
| 15 | `parent_task_id` | `uuid` | sim |  |  |  |
| 16 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 17 | `updated_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| tasks_company_id_fkey | FOREIGN KEY | `FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| tasks_contact_id_fkey | FOREIGN KEY | `FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| tasks_deal_id_fkey | FOREIGN KEY | `FOREIGN KEY (deal_id) REFERENCES deals(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| tasks_parent_task_id_fkey | FOREIGN KEY | `FOREIGN KEY (parent_task_id) REFERENCES tasks(id)` | NO ACTION | NO ACTION | sim |
| tasks_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| tasks_priority_check | CHECK | `CHECK (priority = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text, 'urgent'::text]))` |  |  | sim |
| tasks_recurrence_check | CHECK | `CHECK (recurrence = ANY (ARRAY['none'::text, 'daily'::text, 'weekly'::text, 'monthly'::text]))` |  |  | sim |
| tasks_status_check | CHECK | `CHECK (status = ANY (ARRAY['pending'::text, 'in_progress'::text, 'completed'::text, 'cancelled'::text]))` |  |  | sim |
| tasks_task_type_check | CHECK | `CHECK (task_type = ANY (ARRAY['todo'::text, 'call'::text, 'email'::text, 'meeting'::text, 'follow_up'::text, 'proposal'::text, 'other'::text]))` |  |  | sim |
| tasks_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.tasks | tasks_parent_task_id_fkey | parent_task_id | NO ACTION |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_tasks_company | btree | company_id | não | sim |  | `CREATE INDEX idx_tasks_company ON public.tasks USING btree (company_id)` |
| idx_tasks_contact_id_fk | btree | contact_id | não | sim |  | `CREATE INDEX idx_tasks_contact_id_fk ON public.tasks USING btree (contact_id)` |
| idx_tasks_deal_id | btree | deal_id | não | sim |  | `CREATE INDEX idx_tasks_deal_id ON public.tasks USING btree (deal_id)` |
| idx_tasks_parent_task_id | btree | parent_task_id | não | sim |  | `CREATE INDEX idx_tasks_parent_task_id ON public.tasks USING btree (parent_task_id)` |
| idx_tasks_pending | btree | user_id, due_date | não | sim | `(status = 'pending'::text)` | `CREATE INDEX idx_tasks_pending ON public.tasks USING btree (user_id, due_date) WHERE (status = 'pending'::text)` |
| idx_tasks_status | btree | status | não | sim |  | `CREATE INDEX idx_tasks_status ON public.tasks USING btree (status)` |
| idx_tasks_user_id | btree | user_id | não | sim |  | `CREATE INDEX idx_tasks_user_id ON public.tasks USING btree (user_id)` |
| tasks_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX tasks_pkey ON public.tasks USING btree (id)` |


## Policies (RLS)

### `tasks_delete`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `tasks_insert`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |

### `tasks_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `tasks_update`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| trg_tasks_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
