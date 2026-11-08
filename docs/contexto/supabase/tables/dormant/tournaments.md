# _dormant.tournaments

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
| 2 | `name` | `text` | não |  |  |  |
| 3 | `description` | `text` | sim |  |  |  |
| 4 | `tournament_type` | `text` | não | `'bracket'::text` |  |  |
| 5 | `status` | `text` | não | `'registration'::text` |  |  |
| 6 | `metric` | `text` | não | `'revenue'::text` |  |  |
| 7 | `start_date` | `date` | não |  |  |  |
| 8 | `end_date` | `date` | não |  |  |  |
| 9 | `max_participants` | `integer` | sim | `16` |  |  |
| 10 | `xp_reward_winner` | `integer` | sim | `500` |  |  |
| 11 | `xp_reward_runner_up` | `integer` | sim | `250` |  |  |
| 12 | `xp_reward_participant` | `integer` | sim | `50` |  |  |
| 13 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 14 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| tournaments_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| tournaments_status_check | CHECK | `CHECK (status = ANY (ARRAY['registration'::text, 'active'::text, 'completed'::text, 'cancelled'::text]))` |  |  | sim |
| tournaments_tournament_type_check | CHECK | `CHECK (tournament_type = ANY (ARRAY['bracket'::text, 'round_robin'::text, 'swiss'::text]))` |  |  | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| _dormant.tournament_matches | tournament_matches_tournament_id_fkey | tournament_id | CASCADE |
| _dormant.tournament_participants | tournament_participants_tournament_id_fkey | tournament_id | CASCADE |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| tournaments_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX tournaments_pkey ON _dormant.tournaments USING btree (id)` |


## Policies (RLS)

> ⚠️ RLS **desabilitado** nesta tabela.



## Triggers

_nenhum_


## Grants

_nenhum_
