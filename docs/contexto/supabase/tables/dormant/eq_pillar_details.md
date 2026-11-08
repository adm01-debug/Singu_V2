# _dormant.eq_pillar_details

> Detalhamento dos 4 pilares do EQ

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
| 1 | `id` | `uuid` | não | `uuid_generate_v4()` |  |  |
| 2 | `eq_score_id` | `uuid` | não |  |  |  |
| 3 | `pillar_name` | `character varying(50)` | não |  |  |  |
| 4 | `pillar_score` | `integer` | sim |  |  |  |
| 5 | `subcomponents` | `jsonb` | sim |  |  |  |
| 6 | `observed_indicators` | `text[]` | sim |  |  |  |
| 7 | `strengths` | `text[]` | sim |  |  |  |
| 8 | `development_areas` | `text[]` | sim |  |  |  |
| 9 | `recommendations` | `text[]` | sim |  |  |  |
| 10 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| eq_pillar_details_eq_score_id_fkey | FOREIGN KEY | `FOREIGN KEY (eq_score_id) REFERENCES contact_eq_scores(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| eq_pillar_details_pillar_score_check | CHECK | `CHECK (pillar_score >= 0 AND pillar_score <= 100)` |  |  | sim |
| eq_pillar_details_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| eq_pillar_details_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX eq_pillar_details_pkey ON _dormant.eq_pillar_details USING btree (id)` |


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
