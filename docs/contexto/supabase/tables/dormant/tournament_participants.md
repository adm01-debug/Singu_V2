# _dormant.tournament_participants

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
| 3 | `salesperson_id` | `uuid` | não |  |  |  |
| 4 | `seed` | `integer` | sim |  |  |  |
| 5 | `final_rank` | `integer` | sim |  |  |  |
| 6 | `total_score` | `numeric(12,2)` | sim | `0` |  |  |
| 7 | `status` | `text` | sim | `'active'::text` |  |  |
| 8 | `joined_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| tournament_participants_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| tournament_participants_salesperson_id_fkey | FOREIGN KEY | `FOREIGN KEY (salesperson_id) REFERENCES salespeople(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| tournament_participants_status_check | CHECK | `CHECK (status = ANY (ARRAY['active'::text, 'eliminated'::text, 'winner'::text, 'runner_up'::text]))` |  |  | sim |
| tournament_participants_tournament_id_fkey | FOREIGN KEY | `FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| tournament_participants_tournament_id_salesperson_id_key | UNIQUE | `UNIQUE (tournament_id, salesperson_id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| tournament_participants_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX tournament_participants_pkey ON _dormant.tournament_participants USING btree (id)` |
| tournament_participants_tournament_id_salesperson_id_key | btree | tournament_id, salesperson_id | sim | sim |  | `CREATE UNIQUE INDEX tournament_participants_tournament_id_salesperson_id_key ON _dormant.tournament_participants USING btree (tournament_id, salesperson_id)` |


## Policies (RLS)

> ⚠️ RLS **desabilitado** nesta tabela.



## Triggers

_nenhum_


## Grants

_nenhum_
