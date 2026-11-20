# public.external_data_audit_log

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
| 3 | `operation` | `text` | não |  |  |  |
| 4 | `table_name` | `text` | não |  |  |  |
| 5 | `payload` | `jsonb` | sim |  |  |  |
| 6 | `outcome` | `text` | não |  |  |  |
| 7 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| external_data_audit_log_operation_check | CHECK | `CHECK (operation = ANY (ARRAY['select'::text, 'insert'::text, 'update'::text, 'delete'::text, 'distinct'::text, 'schema'::text, 'list_tables'::text]))` |  |  | sim |
| external_data_audit_log_outcome_check | CHECK | `CHECK (outcome = ANY (ARRAY['success'::text, 'denied'::text, 'error'::text]))` |  |  | sim |
| external_data_audit_log_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| external_data_audit_log_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| external_data_audit_log_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX external_data_audit_log_pkey ON public.external_data_audit_log USING btree (id)` |
| idx_external_data_audit_outcome | btree | outcome, created_at | não | sim | `(outcome = ANY (ARRAY['denied'::text, 'error'::text]))` | `CREATE INDEX idx_external_data_audit_outcome ON public.external_data_audit_log USING btree (outcome, created_at DESC) WHERE (outcome = ANY (ARRAY['denied'::text, 'error'::text]))` |
| idx_external_data_audit_user | btree | user_id, created_at | não | sim |  | `CREATE INDEX idx_external_data_audit_user ON public.external_data_audit_log USING btree (user_id, created_at DESC)` |


## Policies (RLS)

### `admin_only_select_external_data_audit`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | public |
| USING | `has_role(auth.uid(), 'admin'::app_role)` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
