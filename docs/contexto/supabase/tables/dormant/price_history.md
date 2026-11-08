# _dormant.price_history

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
| 2 | `supplier_product_id` | `uuid` | sim |  |  |  |
| 3 | `product_id` | `uuid` | sim |  |  |  |
| 4 | `supplier_id` | `uuid` | sim |  |  |  |
| 5 | `old_price` | `numeric` | não |  |  |  |
| 6 | `new_price` | `numeric` | não |  |  |  |
| 7 | `recorded_at` | `timestamp with time zone` | não | `now()` |  |  |
| 8 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| price_history_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| price_history_product_id_fkey | FOREIGN KEY | `FOREIGN KEY (product_id) REFERENCES _dormant.products(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| price_history_supplier_id_fkey | FOREIGN KEY | `FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| price_history_supplier_product_id_fkey | FOREIGN KEY | `FOREIGN KEY (supplier_product_id) REFERENCES supplier_products(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| price_history_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX price_history_pkey ON _dormant.price_history USING btree (id)` |


## Policies (RLS)

> ⚠️ RLS **desabilitado** nesta tabela.



## Triggers

_nenhum_


## Grants

_nenhum_
