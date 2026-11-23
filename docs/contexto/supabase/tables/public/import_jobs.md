# public.import_jobs

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
| 3 | `entity_type` | `text` | não |  |  |  |
| 4 | `status` | `text` | sim | `'pending'::text` |  |  |
| 5 | `file_name` | `text` | sim |  |  |  |
| 6 | `file_url` | `text` | sim |  |  |  |
| 7 | `total_rows` | `integer` | sim | `0` |  |  |
| 8 | `processed_rows` | `integer` | sim | `0` |  |  |
| 9 | `success_rows` | `integer` | sim | `0` |  |  |
| 10 | `error_rows` | `integer` | sim | `0` |  |  |
| 11 | `errors` | `jsonb` | sim | `'[]'::jsonb` |  |  |
| 12 | `mapping` | `jsonb` | sim | `'{}'::jsonb` |  |  |
| 13 | `options` | `jsonb` | sim | `'{}'::jsonb` |  |  |
| 14 | `started_at` | `timestamp with time zone` | sim |  |  |  |
| 15 | `completed_at` | `timestamp with time zone` | sim |  |  |  |
| 16 | `created_by` | `uuid` | sim |  |  |  |
| 17 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| import_jobs_created_by_fkey | FOREIGN KEY | `FOREIGN KEY (created_by) REFERENCES profiles(id)` | NO ACTION | NO ACTION | sim |
| import_jobs_entity_type_check | CHECK | `CHECK (entity_type = ANY (ARRAY['companies'::text, 'contacts'::text, 'interactions'::text, 'deals'::text]))` |  |  | sim |
| import_jobs_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| import_jobs_status_check | CHECK | `CHECK (status = ANY (ARRAY['pending'::text, 'validating'::text, 'importing'::text, 'completed'::text, 'failed'::text]))` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_import_jobs_created_by | btree | created_by | não | sim |  | `CREATE INDEX idx_import_jobs_created_by ON public.import_jobs USING btree (created_by)` |
| import_jobs_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX import_jobs_pkey ON public.import_jobs USING btree (id)` |


## Policies (RLS)

### `import_jobs_owner_or_admin_mfa`

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
