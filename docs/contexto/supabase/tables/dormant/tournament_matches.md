# _dormant.tournament_matches

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
| 2 | `tournament_id` | `uuid` | não |  |  |  |
| 3 | `round` | `integer` | não |  |  |  |
| 4 | `match_number` | `integer` | não |  |  |  |
| 5 | `player1_id` | `uuid` | sim |  |  |  |
| 6 | `player2_id` | `uuid` | sim |  |  |  |
| 7 | `player1_score` | `numeric(12,2)` | sim | `0` |  |  |
| 8 | `player2_score` | `numeric(12,2)` | sim | `0` |  |  |
| 9 | `winner_id` | `uuid` | sim |  |  |  |
| 10 | `status` | `text` | sim | `'pending'::text` |  |  |
| 11 | `scheduled_start` | `date` | sim |  |  |  |
| 12 | `scheduled_end` | `date` | sim |  |  |  |
| 13 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| tournament_matches_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| tournament_matches_player1_id_fkey | FOREIGN KEY | `FOREIGN KEY (player1_id) REFERENCES salespeople(id)` | NO ACTION | NO ACTION | sim |
| tournament_matches_player2_id_fkey | FOREIGN KEY | `FOREIGN KEY (player2_id) REFERENCES salespeople(id)` | NO ACTION | NO ACTION | sim |
| tournament_matches_status_check | CHECK | `CHECK (status = ANY (ARRAY['pending'::text, 'active'::text, 'completed'::text]))` |  |  | sim |
| tournament_matches_tournament_id_fkey | FOREIGN KEY | `FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| tournament_matches_winner_id_fkey | FOREIGN KEY | `FOREIGN KEY (winner_id) REFERENCES salespeople(id)` | NO ACTION | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| tournament_matches_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX tournament_matches_pkey ON _dormant.tournament_matches USING btree (id)` |


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
