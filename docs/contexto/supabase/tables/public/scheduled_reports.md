# public.scheduled_reports

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
| 2 | `name` | `text` | não |  |  |  |
| 3 | `report_type` | `text` | não |  |  |  |
| 4 | `parameters` | `jsonb` | sim | `'{}'::jsonb` |  |  |
| 5 | `schedule_cron` | `text` | não |  |  |  |
| 6 | `recipients` | `text[]` | não |  |  |  |
| 7 | `format` | `text` | sim | `'pdf'::text` |  |  |
| 8 | `is_active` | `boolean` | sim | `true` |  |  |
| 9 | `last_run_at` | `timestamp with time zone` | sim |  |  |  |
| 10 | `next_run_at` | `timestamp with time zone` | sim |  |  |  |
| 11 | `created_by` | `uuid` | sim |  |  |  |
| 12 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| scheduled_reports_created_by_fkey | FOREIGN KEY | `FOREIGN KEY (created_by) REFERENCES profiles(id)` | NO ACTION | NO ACTION | sim |
| scheduled_reports_format_check | CHECK | `CHECK (format = ANY (ARRAY['pdf'::text, 'xlsx'::text, 'csv'::text]))` |  |  | sim |
| scheduled_reports_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.report_executions | report_executions_scheduled_report_id_fkey | scheduled_report_id | CASCADE |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_scheduled_reports_created_by | btree | created_by | não | sim |  | `CREATE INDEX idx_scheduled_reports_created_by ON public.scheduled_reports USING btree (created_by)` |
| scheduled_reports_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX scheduled_reports_pkey ON public.scheduled_reports USING btree (id)` |


## Policies (RLS)

### `scheduled_reports_owner_or_admin_mfa`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `((created_by = ( SELECT auth.uid() AS uid)) OR (( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role) AND (( SELECT (auth.jwt() ->> 'aal'::text)) = 'aal2'::text)))` |
| WITH CHECK | `((created_by = ( SELECT auth.uid() AS uid)) OR (( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role) AND (( SELECT (auth.jwt() ->> 'aal'::text)) = 'aal2'::text)))` |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
