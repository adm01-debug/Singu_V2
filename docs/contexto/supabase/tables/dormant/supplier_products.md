# _dormant.supplier_products

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
| 2 | `supplier_id` | `uuid` | sim |  |  |  |
| 3 | `product_id` | `uuid` | sim |  |  |  |
| 4 | `unit_price` | `numeric(12,2)` | não |  |  |  |
| 5 | `min_order_quantity` | `integer` | sim | `1` |  |  |
| 6 | `currency` | `text` | sim | `'BRL'::text` |  |  |
| 7 | `last_price_update` | `timestamp with time zone` | sim | `now()` |  |  |
| 8 | `is_preferred` | `boolean` | sim | `false` |  |  |
| 9 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 10 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| supplier_products_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| supplier_products_product_id_fkey | FOREIGN KEY | `FOREIGN KEY (product_id) REFERENCES _dormant.products(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| supplier_products_supplier_id_fkey | FOREIGN KEY | `FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| supplier_products_supplier_id_product_id_key | UNIQUE | `UNIQUE (supplier_id, product_id)` |  |  | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| _dormant.price_history | price_history_supplier_product_id_fkey | supplier_product_id | CASCADE |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| supplier_products_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX supplier_products_pkey ON _dormant.supplier_products USING btree (id)` |
| supplier_products_supplier_id_product_id_key | btree | supplier_id, product_id | sim | sim |  | `CREATE UNIQUE INDEX supplier_products_supplier_id_product_id_key ON _dormant.supplier_products USING btree (supplier_id, product_id)` |


## Policies (RLS)

> ⚠️ RLS **desabilitado** nesta tabela.



## Triggers

_nenhum_


## Grants

_nenhum_
