# _dormant.sales_streaks

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
| 2 | `salesperson_id` | `uuid` | não |  |  |  |
| 3 | `streak_type` | `text` | não | `'daily_sales'::text` |  |  |
| 4 | `current_streak` | `integer` | não | `0` |  |  |
| 5 | `best_streak` | `integer` | não | `0` |  |  |
| 6 | `last_activity_date` | `date` | sim |  |  |  |
| 7 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 8 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| sales_streaks_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| sales_streaks_salesperson_id_fkey | FOREIGN KEY | `FOREIGN KEY (salesperson_id) REFERENCES salespeople(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| sales_streaks_salesperson_id_streak_type_key | UNIQUE | `UNIQUE (salesperson_id, streak_type)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| sales_streaks_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX sales_streaks_pkey ON _dormant.sales_streaks USING btree (id)` |
| sales_streaks_salesperson_id_streak_type_key | btree | salesperson_id, streak_type | sim | sim |  | `CREATE UNIQUE INDEX sales_streaks_salesperson_id_streak_type_key ON _dormant.sales_streaks USING btree (salesperson_id, streak_type)` |


## Policies (RLS)

> ⚠️ RLS **desabilitado** nesta tabela.



## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| anon | SELECT |
| authenticated | SELECT |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
