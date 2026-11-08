# _dormant.inventory_levels

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
| 2 | `product_id` | `uuid` | sim |  |  |  |
| 3 | `current_stock` | `integer` | não | `0` |  |  |
| 4 | `min_stock_level` | `integer` | não | `10` |  |  |
| 5 | `max_stock_level` | `integer` | não | `100` |  |  |
| 6 | `reorder_point` | `integer` | não | `20` |  |  |
| 7 | `lead_time_days` | `integer` | sim | `7` |  |  |
| 8 | `last_restock_date` | `timestamp with time zone` | sim |  |  |  |
| 9 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 10 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| inventory_levels_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| inventory_levels_product_id_fkey | FOREIGN KEY | `FOREIGN KEY (product_id) REFERENCES _dormant.products(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| inventory_levels_product_id_key | UNIQUE | `UNIQUE (product_id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| inventory_levels_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX inventory_levels_pkey ON _dormant.inventory_levels USING btree (id)` |
| inventory_levels_product_id_key | btree | product_id | sim | sim |  | `CREATE UNIQUE INDEX inventory_levels_product_id_key ON _dormant.inventory_levels USING btree (product_id)` |


## Policies (RLS)

> ⚠️ RLS **desabilitado** nesta tabela.



## Triggers

_nenhum_


## Grants

_nenhum_
