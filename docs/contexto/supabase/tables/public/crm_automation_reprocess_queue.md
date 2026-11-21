# public.crm_automation_reprocess_queue

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
| 2 | `log_id` | `uuid` | sim |  |  |  |
| 3 | `retry_count` | `integer` | sim | `0` |  |  |
| 4 | `max_retries` | `integer` | sim | `3` |  |  |
| 5 | `next_retry_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 6 | `status` | `text` | sim | `'pending'::text` |  |  |
| 7 | `last_error` | `text` | sim |  |  |  |
| 8 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| crm_automation_reprocess_queue_log_id_fkey | FOREIGN KEY | `FOREIGN KEY (log_id) REFERENCES crm_automation_logs(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| crm_automation_reprocess_queue_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| crm_automation_reprocess_queue_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX crm_automation_reprocess_queue_pkey ON public.crm_automation_reprocess_queue USING btree (id)` |


## Policies (RLS)

### `Users can view their own reprocess queue`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) IN ( SELECT crm_automation_logs.user_id    FROM crm_automation_logs   WHERE (crm_automation_logs.id = crm_automation_reprocess_queue.log_id)))` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
