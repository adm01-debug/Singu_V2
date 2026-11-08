# _dormant.sales_battles

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
| 2 | `title` | `text` | não |  |  |  |
| 3 | `description` | `text` | sim |  |  |  |
| 4 | `start_date` | `date` | não |  |  |  |
| 5 | `end_date` | `date` | não |  |  |  |
| 6 | `metric` | `text` | não | `'revenue'::text` |  |  |
| 7 | `status` | `text` | não | `'upcoming'::text` |  |  |
| 8 | `xp_reward` | `integer` | não | `200` |  |  |
| 9 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 10 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| sales_battles_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| sales_battles_status_check | CHECK | `CHECK (status = ANY (ARRAY['upcoming'::text, 'active'::text, 'completed'::text]))` |  |  | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| _dormant.battle_participants | battle_participants_battle_id_fkey | battle_id | CASCADE |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| sales_battles_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX sales_battles_pkey ON _dormant.sales_battles USING btree (id)` |


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
