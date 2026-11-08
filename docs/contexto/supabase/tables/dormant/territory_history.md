# _dormant.territory_history

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
| 2 | `territory_id` | `uuid` | não |  |  |  |
| 3 | `from_salesperson_id` | `uuid` | sim |  |  |  |
| 4 | `to_salesperson_id` | `uuid` | sim |  |  |  |
| 5 | `reason` | `text` | sim |  |  |  |
| 6 | `transferred_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| territory_history_from_salesperson_id_fkey | FOREIGN KEY | `FOREIGN KEY (from_salesperson_id) REFERENCES salespeople(id)` | NO ACTION | NO ACTION | sim |
| territory_history_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| territory_history_territory_id_fkey | FOREIGN KEY | `FOREIGN KEY (territory_id) REFERENCES sales_territories(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| territory_history_to_salesperson_id_fkey | FOREIGN KEY | `FOREIGN KEY (to_salesperson_id) REFERENCES salespeople(id)` | NO ACTION | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| territory_history_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX territory_history_pkey ON _dormant.territory_history USING btree (id)` |


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
