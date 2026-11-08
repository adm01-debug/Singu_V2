# public.clients

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
| 3 | `email` | `text` | sim |  |  |  |
| 4 | `phone` | `text` | sim |  |  |  |
| 5 | `company` | `text` | sim |  |  |  |
| 6 | `total_value` | `numeric` | não | `0` |  |  |
| 7 | `deleted_at` | `timestamp with time zone` | sim |  |  |  |
| 8 | `deleted_by` | `uuid` | sim |  |  |  |
| 9 | `delete_reason` | `text` | sim |  |  |  |
| 10 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 11 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| clients_deleted_by_fkey | FOREIGN KEY | `FOREIGN KEY (deleted_by) REFERENCES auth.users(id)` | NO ACTION | NO ACTION | sim |
| clients_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| _dormant.client_portfolio | client_portfolio_client_id_fkey | client_id | CASCADE |
| _dormant.icp_data | icp_data_client_id_fkey | client_id | CASCADE |
| _dormant.lead_routing_log | lead_routing_log_client_id_fkey | client_id | SET NULL |
| _dormant.quotes | quotes_client_id_fkey | client_id | SET NULL |
| public.sales_tasks | sales_tasks_client_id_fkey | client_id | SET NULL |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| clients_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX clients_pkey ON public.clients USING btree (id)` |
| idx_clients_deleted_by | btree | deleted_by | não | sim |  | `CREATE INDEX idx_clients_deleted_by ON public.clients USING btree (deleted_by)` |


## Policies (RLS)

### `clients_all`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |
| WITH CHECK | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| set_updated_at | BEFORE | UPDATE | ROW | enabled | public.set_updated_at |


## Grants

_nenhum_
