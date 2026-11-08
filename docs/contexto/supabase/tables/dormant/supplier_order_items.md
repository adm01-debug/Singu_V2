# _dormant.supplier_order_items

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
| 2 | `order_id` | `uuid` | sim |  |  |  |
| 3 | `product_id` | `uuid` | sim |  |  |  |
| 4 | `quantity` | `integer` | não |  |  |  |
| 5 | `unit_price` | `numeric(12,2)` | não |  |  |  |
| 6 | `total_price` | `numeric(12,2)` | não |  |  |  |
| 7 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| supplier_order_items_order_id_fkey | FOREIGN KEY | `FOREIGN KEY (order_id) REFERENCES supplier_orders(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| supplier_order_items_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| supplier_order_items_product_id_fkey | FOREIGN KEY | `FOREIGN KEY (product_id) REFERENCES _dormant.products(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| supplier_order_items_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX supplier_order_items_pkey ON _dormant.supplier_order_items USING btree (id)` |


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
