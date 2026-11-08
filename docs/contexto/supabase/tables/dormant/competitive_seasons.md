# _dormant.competitive_seasons

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
| 3 | `start_date` | `date` | não |  |  |  |
| 4 | `end_date` | `date` | não |  |  |  |
| 5 | `status` | `text` | não | `'upcoming'::text` |  |  |
| 6 | `prize_description` | `text` | sim |  |  |  |
| 7 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| competitive_seasons_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| competitive_seasons_status_check | CHECK | `CHECK (status = ANY (ARRAY['upcoming'::text, 'active'::text, 'completed'::text]))` |  |  | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| _dormant.salesperson_leagues | salesperson_leagues_season_id_fkey | season_id | NO ACTION |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| competitive_seasons_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX competitive_seasons_pkey ON _dormant.competitive_seasons USING btree (id)` |


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
