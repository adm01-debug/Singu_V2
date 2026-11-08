# public.connection_test_logs

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


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `connection_id` | `uuid` | não |  |  |  |
| 3 | `status` | `text` | não |  |  |  |
| 4 | `latency_ms` | `integer` | sim |  |  |  |
| 5 | `message` | `text` | sim |  |  |  |
| 6 | `details` | `jsonb` | sim |  |  |  |
| 7 | `tested_by` | `uuid` | sim |  |  |  |
| 8 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| connection_test_logs_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| connection_test_logs_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX connection_test_logs_pkey ON public.connection_test_logs USING btree (id)` |
| idx_connection_test_logs_conn | btree | connection_id, created_at | não | sim |  | `CREATE INDEX idx_connection_test_logs_conn ON public.connection_test_logs USING btree (connection_id, created_at DESC)` |


## Policies (RLS)

### `admins insert connection_test_logs`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)` |

### `admins read connection_test_logs`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| trg_notify_connection_failures | AFTER | INSERT | ROW | enabled | public.notify_connection_failures |


## Grants

_nenhum_
