# _dormant.template_performance

> Registro de uso e performance de templates para melhoria contínua

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
| 2 | `template_type` | `character varying(50)` | não |  |  |  |
| 3 | `template_id` | `uuid` | não |  |  |  |
| 4 | `contact_id` | `uuid` | sim |  |  |  |
| 5 | `user_id` | `uuid` | sim |  |  |  |
| 6 | `used_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 7 | `response_received` | `boolean` | sim | `false` |  |  |
| 8 | `response_time_hours` | `integer` | sim |  |  |  |
| 9 | `outcome` | `character varying(50)` | sim |  |  |  |
| 10 | `converted_to_deal` | `boolean` | sim | `false` |  |  |
| 11 | `deal_value` | `numeric(15,2)` | sim |  |  |  |
| 12 | `feedback_score` | `integer` | sim |  |  |  |
| 13 | `notes` | `text` | sim |  |  |  |
| 14 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| template_performance_contact_id_fkey | FOREIGN KEY | `FOREIGN KEY (contact_id) REFERENCES contacts(id)` | NO ACTION | NO ACTION | sim |
| template_performance_feedback_score_check | CHECK | `CHECK (feedback_score >= 1 AND feedback_score <= 5)` |  |  | sim |
| template_performance_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| template_performance_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES profiles(id)` | NO ACTION | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| template_performance_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX template_performance_pkey ON _dormant.template_performance USING btree (id)` |


## Policies (RLS)

> ⚠️ RLS **desabilitado** nesta tabela.



## Triggers

_nenhum_


## Grants

_nenhum_
