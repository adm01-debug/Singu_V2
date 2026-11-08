# _dormant.products

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
| 3 | `category` | `text` | não | `'subscription'::text` |  |  |
| 4 | `price` | `numeric` | não | `0` |  |  |
| 5 | `sales_count` | `integer` | não | `0` |  |  |
| 6 | `rating` | `numeric` | não | `0` |  |  |
| 7 | `status` | `text` | não | `'ativo'::text` |  |  |
| 8 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 9 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| products_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| _dormant.demand_forecasts | demand_forecasts_product_id_fkey | product_id | CASCADE |
| _dormant.inventory_levels | inventory_levels_product_id_fkey | product_id | CASCADE |
| _dormant.price_alerts | price_alerts_product_id_fkey | product_id | CASCADE |
| _dormant.price_history | price_history_product_id_fkey | product_id | CASCADE |
| _dormant.stock_movements | stock_movements_product_id_fkey | product_id | CASCADE |
| _dormant.supplier_order_items | supplier_order_items_product_id_fkey | product_id | SET NULL |
| _dormant.supplier_products | supplier_products_product_id_fkey | product_id | CASCADE |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| products_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX products_pkey ON _dormant.products USING btree (id)` |


## Policies (RLS)

### `dormant_deny_all_products`

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
