# _dormant.prize_wheel_spins

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
| 3 | `prize_type` | `text` | não |  |  |  |
| 4 | `prize_value` | `text` | não |  |  |  |
| 5 | `xp_bonus` | `integer` | sim | `0` |  |  |
| 6 | `spun_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| prize_wheel_spins_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| prize_wheel_spins_salesperson_id_fkey | FOREIGN KEY | `FOREIGN KEY (salesperson_id) REFERENCES salespeople(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| prize_wheel_spins_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX prize_wheel_spins_pkey ON _dormant.prize_wheel_spins USING btree (id)` |


## Policies (RLS)

> ⚠️ RLS **desabilitado** nesta tabela.



## Triggers

_nenhum_


## Grants

_nenhum_
