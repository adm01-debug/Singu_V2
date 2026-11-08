# _dormant.script_usage_log

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
| 2 | `script_id` | `uuid` | não |  |  |  |
| 3 | `contact_id` | `uuid` | sim |  |  |  |
| 4 | `user_id` | `uuid` | sim |  |  |  |
| 5 | `started_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 6 | `completed_at` | `timestamp with time zone` | sim |  |  |  |
| 7 | `duration_seconds` | `integer` | sim |  |  |  |
| 8 | `outcome` | `character varying(50)` | sim |  |  |  |
| 9 | `outcome_details` | `text` | sim |  |  |  |
| 10 | `sections_completed` | `text[]` | sim |  |  |  |
| 11 | `adaptations_made` | `jsonb` | sim |  |  |  |
| 12 | `effectiveness_rating` | `integer` | sim |  |  |  |
| 13 | `notes` | `text` | sim |  |  |  |
| 14 | `next_action` | `text` | sim |  |  |  |
| 15 | `follow_up_date` | `timestamp with time zone` | sim |  |  |  |
| 16 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| script_usage_log_contact_id_fkey | FOREIGN KEY | `FOREIGN KEY (contact_id) REFERENCES contacts(id)` | NO ACTION | NO ACTION | sim |
| script_usage_log_effectiveness_rating_check | CHECK | `CHECK (effectiveness_rating >= 1 AND effectiveness_rating <= 5)` |  |  | sim |
| script_usage_log_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| script_usage_log_script_id_fkey | FOREIGN KEY | `FOREIGN KEY (script_id) REFERENCES sales_scripts(id)` | NO ACTION | NO ACTION | sim |
| script_usage_log_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES profiles(id)` | NO ACTION | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| script_usage_log_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX script_usage_log_pkey ON _dormant.script_usage_log USING btree (id)` |


## Policies (RLS)

> ⚠️ RLS **desabilitado** nesta tabela.



## Triggers

_nenhum_


## Grants

_nenhum_
