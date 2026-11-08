# _dormant.progressive_goals

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
| 3 | `goal_type` | `text` | não |  |  |  |
| 4 | `current_tier` | `integer` | não | `1` |  |  |
| 5 | `current_value` | `numeric` | não | `0` |  |  |
| 6 | `tier_target` | `numeric` | não |  |  |  |
| 7 | `completed_tiers` | `jsonb` | sim | `'[]'::jsonb` |  |  |
| 8 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 9 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| progressive_goals_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| progressive_goals_salesperson_id_fkey | FOREIGN KEY | `FOREIGN KEY (salesperson_id) REFERENCES salespeople(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| progressive_goals_salesperson_id_goal_type_key | UNIQUE | `UNIQUE (salesperson_id, goal_type)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| progressive_goals_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX progressive_goals_pkey ON _dormant.progressive_goals USING btree (id)` |
| progressive_goals_salesperson_id_goal_type_key | btree | salesperson_id, goal_type | sim | sim |  | `CREATE UNIQUE INDEX progressive_goals_salesperson_id_goal_type_key ON _dormant.progressive_goals USING btree (salesperson_id, goal_type)` |


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
