# _dormant.performance_bets

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
| 2 | `bettor_id` | `uuid` | não |  |  |  |
| 3 | `target_id` | `uuid` | não |  |  |  |
| 4 | `bet_type` | `text` | não | `'will_hit_goal'::text` |  |  |
| 5 | `xp_wagered` | `integer` | não | `50` |  |  |
| 6 | `xp_potential_win` | `integer` | não | `100` |  |  |
| 7 | `status` | `text` | sim | `'active'::text` |  |  |
| 8 | `resolution_date` | `date` | sim |  |  |  |
| 9 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| performance_bets_bettor_id_fkey | FOREIGN KEY | `FOREIGN KEY (bettor_id) REFERENCES salespeople(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| performance_bets_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| performance_bets_status_check | CHECK | `CHECK (status = ANY (ARRAY['active'::text, 'won'::text, 'lost'::text, 'cancelled'::text]))` |  |  | sim |
| performance_bets_target_id_fkey | FOREIGN KEY | `FOREIGN KEY (target_id) REFERENCES salespeople(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| performance_bets_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX performance_bets_pkey ON _dormant.performance_bets USING btree (id)` |


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
