# public.report_executions

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
| 2 | `scheduled_report_id` | `uuid` | sim |  |  |  |
| 3 | `status` | `text` | sim | `'pending'::text` |  |  |
| 4 | `started_at` | `timestamp with time zone` | sim |  |  |  |
| 5 | `completed_at` | `timestamp with time zone` | sim |  |  |  |
| 6 | `file_url` | `text` | sim |  |  |  |
| 7 | `error_message` | `text` | sim |  |  |  |
| 8 | `metadata` | `jsonb` | sim | `'{}'::jsonb` |  |  |
| 9 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| report_executions_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| report_executions_scheduled_report_id_fkey | FOREIGN KEY | `FOREIGN KEY (scheduled_report_id) REFERENCES scheduled_reports(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| report_executions_status_check | CHECK | `CHECK (status = ANY (ARRAY['pending'::text, 'running'::text, 'completed'::text, 'failed'::text]))` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_report_executions_scheduled_report_id | btree | scheduled_report_id | não | sim |  | `CREATE INDEX idx_report_executions_scheduled_report_id ON public.report_executions USING btree (scheduled_report_id)` |
| report_executions_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX report_executions_pkey ON public.report_executions USING btree (id)` |


## Policies (RLS)

### `report_executions_owner_or_admin_mfa`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(EXISTS ( SELECT 1    FROM scheduled_reports r   WHERE ((r.id = report_executions.scheduled_report_id) AND ((r.created_by = ( SELECT auth.uid() AS uid)) OR (( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role) AND (( SELECT (auth.jwt() ->> 'aal'::text)) = 'aal2'::text))))))` |
| WITH CHECK | `(EXISTS ( SELECT 1    FROM scheduled_reports r   WHERE ((r.id = report_executions.scheduled_report_id) AND ((r.created_by = ( SELECT auth.uid() AS uid)) OR (( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role) AND (( SELECT (auth.jwt() ->> 'aal'::text)) = 'aal2'::text))))))` |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
