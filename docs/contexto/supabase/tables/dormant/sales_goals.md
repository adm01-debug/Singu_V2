# _dormant.sales_goals

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
| 2 | `salesperson_id` | `uuid` | não |  |  |  |
| 3 | `month` | `date` | não |  |  |  |
| 4 | `goal_amount` | `numeric(12,2)` | não | `0` |  |  |
| 5 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| sales_goals_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| sales_goals_salesperson_id_fkey | FOREIGN KEY | `FOREIGN KEY (salesperson_id) REFERENCES salespeople(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| sales_goals_salesperson_id_month_key | UNIQUE | `UNIQUE (salesperson_id, month)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| sales_goals_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX sales_goals_pkey ON _dormant.sales_goals USING btree (id)` |
| sales_goals_salesperson_id_month_key | btree | salesperson_id, month | sim | sim |  | `CREATE UNIQUE INDEX sales_goals_salesperson_id_month_key ON _dormant.sales_goals USING btree (salesperson_id, month)` |


## Policies (RLS)

### `dormant_deny_all_sales_goals`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | RESTRICTIVE |
| roles | public |
| USING | `false` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| anon | SELECT |
| authenticated | SELECT |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
