# _dormant.rapport_score_history

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
| usada por views | public.vw_communication_dashboard, public.vw_rapport_points |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `uuid_generate_v4()` |  |  |
| 2 | `contact_id` | `uuid` | não |  |  |  |
| 3 | `user_id` | `uuid` | sim |  |  |  |
| 4 | `rapport_score` | `integer` | sim |  |  |  |
| 5 | `rapport_level` | `character varying(20)` | sim |  |  |  |
| 6 | `trust_level` | `integer` | sim |  |  |  |
| 7 | `comfort_level` | `integer` | sim |  |  |  |
| 8 | `engagement_level` | `integer` | sim |  |  |  |
| 9 | `mutual_understanding` | `integer` | sim |  |  |  |
| 10 | `positive_indicators` | `text[]` | sim |  |  |  |
| 11 | `negative_indicators` | `text[]` | sim |  |  |  |
| 12 | `improvement_suggestions` | `text[]` | sim |  |  |  |
| 13 | `assessed_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 14 | `is_current` | `boolean` | sim | `true` |  |  |
| 15 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| rapport_score_history_contact_id_fkey | FOREIGN KEY | `FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| rapport_score_history_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| rapport_score_history_rapport_score_check | CHECK | `CHECK (rapport_score >= 0 AND rapport_score <= 100)` |  |  | sim |
| rapport_score_history_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES profiles(id)` | NO ACTION | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| rapport_score_history_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX rapport_score_history_pkey ON _dormant.rapport_score_history USING btree (id)` |


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
