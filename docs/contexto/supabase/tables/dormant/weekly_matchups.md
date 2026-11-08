# _dormant.weekly_matchups

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
| 2 | `player1_id` | `uuid` | não |  |  |  |
| 3 | `player2_id` | `uuid` | não |  |  |  |
| 4 | `week_start` | `date` | não |  |  |  |
| 5 | `week_end` | `date` | não |  |  |  |
| 6 | `player1_score` | `numeric(12,2)` | não | `0` |  |  |
| 7 | `player2_score` | `numeric(12,2)` | não | `0` |  |  |
| 8 | `winner_id` | `uuid` | sim |  |  |  |
| 9 | `status` | `text` | não | `'active'::text` |  |  |
| 10 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| weekly_matchups_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| weekly_matchups_player1_id_fkey | FOREIGN KEY | `FOREIGN KEY (player1_id) REFERENCES salespeople(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| weekly_matchups_player2_id_fkey | FOREIGN KEY | `FOREIGN KEY (player2_id) REFERENCES salespeople(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| weekly_matchups_status_check | CHECK | `CHECK (status = ANY (ARRAY['active'::text, 'completed'::text]))` |  |  | sim |
| weekly_matchups_winner_id_fkey | FOREIGN KEY | `FOREIGN KEY (winner_id) REFERENCES salespeople(id)` | NO ACTION | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| weekly_matchups_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX weekly_matchups_pkey ON _dormant.weekly_matchups USING btree (id)` |


## Policies (RLS)

> ⚠️ RLS **desabilitado** nesta tabela.



## Triggers

_nenhum_


## Grants

_nenhum_
