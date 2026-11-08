# _dormant.stock_movements

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
| 3 | `movement_type` | `text` | não |  |  |  |
| 4 | `quantity` | `integer` | não |  |  |  |
| 5 | `reason` | `text` | sim |  |  |  |
| 6 | `reference_id` | `uuid` | sim |  |  |  |
| 7 | `performed_by` | `uuid` | sim |  |  |  |
| 8 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| stock_movements_movement_type_check | CHECK | `CHECK (movement_type = ANY (ARRAY['in'::text, 'out'::text, 'adjustment'::text]))` |  |  | sim |
| stock_movements_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| stock_movements_product_id_fkey | FOREIGN KEY | `FOREIGN KEY (product_id) REFERENCES _dormant.products(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| stock_movements_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX stock_movements_pkey ON _dormant.stock_movements USING btree (id)` |


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
