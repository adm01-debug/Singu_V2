# _dormant.client_portfolio

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | não |
| RLS forçado (owner) | não |
| policies | 0 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `client_id` | `uuid` | não |  |  |  |
| 3 | `salesperson_id` | `uuid` | não |  |  |  |
| 4 | `status` | `text` | não | `'inactive'::text` |  |  |
| 5 | `last_purchase_date` | `date` | sim |  |  |  |
| 6 | `assigned_at` | `timestamp with time zone` | não | `now()` |  |  |
| 7 | `assigned_by` | `uuid` | sim |  |  |  |
| 8 | `source` | `text` | sim | `'database'::text` |  |  |
| 9 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 10 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| client_portfolio_assigned_by_fkey | FOREIGN KEY | `FOREIGN KEY (assigned_by) REFERENCES salespeople(id)` | NO ACTION | NO ACTION | sim |
| client_portfolio_client_id_fkey | FOREIGN KEY | `FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| client_portfolio_client_id_salesperson_id_key | UNIQUE | `UNIQUE (client_id, salesperson_id)` |  |  | sim |
| client_portfolio_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| client_portfolio_salesperson_id_fkey | FOREIGN KEY | `FOREIGN KEY (salesperson_id) REFERENCES salespeople(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| client_portfolio_status_check | CHECK | `CHECK (status = ANY (ARRAY['active'::text, 'inactive'::text]))` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| client_portfolio_client_id_salesperson_id_key | btree | client_id, salesperson_id | sim | sim |  | `CREATE UNIQUE INDEX client_portfolio_client_id_salesperson_id_key ON _dormant.client_portfolio USING btree (client_id, salesperson_id)` |
| client_portfolio_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX client_portfolio_pkey ON _dormant.client_portfolio USING btree (id)` |


## Policies (RLS)

> ⚠️ RLS **desabilitado** nesta tabela.



## Triggers

_nenhum_


## Grants

_nenhum_
