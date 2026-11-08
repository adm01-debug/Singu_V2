# _dormant.team_closers

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 1 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `team_id` | `uuid` | não |  |  |  |
| 3 | `closer_id` | `uuid` | não |  |  |  |
| 4 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| team_closers_closer_id_fkey | FOREIGN KEY | `FOREIGN KEY (closer_id) REFERENCES salespeople(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| team_closers_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| team_closers_team_id_closer_id_key | UNIQUE | `UNIQUE (team_id, closer_id)` |  |  | sim |
| team_closers_team_id_fkey | FOREIGN KEY | `FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| team_closers_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX team_closers_pkey ON _dormant.team_closers USING btree (id)` |
| team_closers_team_id_closer_id_key | btree | team_id, closer_id | sim | sim |  | `CREATE UNIQUE INDEX team_closers_team_id_closer_id_key ON _dormant.team_closers USING btree (team_id, closer_id)` |


## Policies (RLS)

### `dormant_deny_all_team_closers`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | RESTRICTIVE |
| roles | public |
| USING | `false` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| anon | SELECT |
| authenticated | SELECT |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
