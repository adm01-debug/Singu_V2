# public.integration_logs

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
| 2 | `integration_id` | `uuid` | sim |  |  |  |
| 3 | `action` | `text` | não |  |  |  |
| 4 | `direction` | `text` | sim |  |  |  |
| 5 | `status` | `text` | sim |  |  |  |
| 6 | `request_data` | `jsonb` | sim |  |  |  |
| 7 | `response_data` | `jsonb` | sim |  |  |  |
| 8 | `error_message` | `text` | sim |  |  |  |
| 9 | `duration_ms` | `integer` | sim |  |  |  |
| 10 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| integration_logs_direction_check | CHECK | `CHECK (direction = ANY (ARRAY['inbound'::text, 'outbound'::text]))` |  |  | sim |
| integration_logs_integration_id_fkey | FOREIGN KEY | `FOREIGN KEY (integration_id) REFERENCES integrations(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| integration_logs_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| integration_logs_status_check | CHECK | `CHECK (status = ANY (ARRAY['success'::text, 'error'::text, 'pending'::text]))` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_integration_logs_integration_id | btree | integration_id | não | sim |  | `CREATE INDEX idx_integration_logs_integration_id ON public.integration_logs USING btree (integration_id)` |
| integration_logs_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX integration_logs_pkey ON public.integration_logs USING btree (id)` |


## Policies (RLS)

### `integration_logs_all`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |
| WITH CHECK | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |


## Triggers

_nenhum_


## Grants

_nenhum_
