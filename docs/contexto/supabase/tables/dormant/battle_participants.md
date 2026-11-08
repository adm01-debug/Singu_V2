# _dormant.battle_participants

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
| 2 | `battle_id` | `uuid` | não |  |  |  |
| 3 | `salesperson_id` | `uuid` | não |  |  |  |
| 4 | `current_score` | `numeric(12,2)` | não | `0` |  |  |
| 5 | `rank` | `integer` | sim |  |  |  |
| 6 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 7 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| battle_participants_battle_id_fkey | FOREIGN KEY | `FOREIGN KEY (battle_id) REFERENCES sales_battles(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| battle_participants_battle_id_salesperson_id_key | UNIQUE | `UNIQUE (battle_id, salesperson_id)` |  |  | sim |
| battle_participants_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| battle_participants_salesperson_id_fkey | FOREIGN KEY | `FOREIGN KEY (salesperson_id) REFERENCES salespeople(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| battle_participants_battle_id_salesperson_id_key | btree | battle_id, salesperson_id | sim | sim |  | `CREATE UNIQUE INDEX battle_participants_battle_id_salesperson_id_key ON _dormant.battle_participants USING btree (battle_id, salesperson_id)` |
| battle_participants_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX battle_participants_pkey ON _dormant.battle_participants USING btree (id)` |


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
