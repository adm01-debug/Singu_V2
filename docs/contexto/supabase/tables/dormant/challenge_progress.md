# _dormant.challenge_progress

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
| 2 | `challenge_id` | `uuid` | não |  |  |  |
| 3 | `salesperson_id` | `uuid` | não |  |  |  |
| 4 | `current_value` | `integer` | não | `0` |  |  |
| 5 | `completed_at` | `timestamp with time zone` | sim |  |  |  |
| 6 | `xp_claimed` | `boolean` | não | `false` |  |  |
| 7 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 8 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| challenge_progress_challenge_id_fkey | FOREIGN KEY | `FOREIGN KEY (challenge_id) REFERENCES weekly_challenges(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| challenge_progress_challenge_id_salesperson_id_key | UNIQUE | `UNIQUE (challenge_id, salesperson_id)` |  |  | sim |
| challenge_progress_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| challenge_progress_salesperson_id_fkey | FOREIGN KEY | `FOREIGN KEY (salesperson_id) REFERENCES salespeople(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| challenge_progress_challenge_id_salesperson_id_key | btree | challenge_id, salesperson_id | sim | sim |  | `CREATE UNIQUE INDEX challenge_progress_challenge_id_salesperson_id_key ON _dormant.challenge_progress USING btree (challenge_id, salesperson_id)` |
| challenge_progress_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX challenge_progress_pkey ON _dormant.challenge_progress USING btree (id)` |


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
