# _dormant.daily_streak_achievements

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
| 3 | `streak_type` | `text` | não |  |  |  |
| 4 | `achieved_at` | `timestamp with time zone` | não | `now()` |  |  |
| 5 | `streak_count` | `integer` | não |  |  |  |
| 6 | `xp_awarded` | `integer` | não | `0` |  |  |
| 7 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| daily_streak_achievements_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| daily_streak_achievements_salesperson_id_fkey | FOREIGN KEY | `FOREIGN KEY (salesperson_id) REFERENCES salespeople(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| daily_streak_achievements_salesperson_id_streak_type_key | UNIQUE | `UNIQUE (salesperson_id, streak_type)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| daily_streak_achievements_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX daily_streak_achievements_pkey ON _dormant.daily_streak_achievements USING btree (id)` |
| daily_streak_achievements_salesperson_id_streak_type_key | btree | salesperson_id, streak_type | sim | sim |  | `CREATE UNIQUE INDEX daily_streak_achievements_salesperson_id_streak_type_key ON _dormant.daily_streak_achievements USING btree (salesperson_id, streak_type)` |


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
