# _dormant.cadence_steps

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
| 2 | `cadence_id` | `uuid` | não |  |  |  |
| 3 | `day_number` | `integer` | não | `1` |  |  |
| 4 | `action_type` | `text` | não |  |  |  |
| 5 | `title` | `text` | não |  |  |  |
| 6 | `description` | `text` | sim |  |  |  |
| 7 | `template_content` | `text` | sim |  |  |  |
| 8 | `step_order` | `integer` | não | `0` |  |  |
| 9 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| cadence_steps_action_type_check | CHECK | `CHECK (action_type = ANY (ARRAY['email'::text, 'call'::text, 'linkedin'::text, 'whatsapp'::text, 'meeting'::text, 'other'::text]))` |  |  | sim |
| cadence_steps_cadence_id_fkey | FOREIGN KEY | `FOREIGN KEY (cadence_id) REFERENCES cadences(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| cadence_steps_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| _dormant.cadence_tasks | cadence_tasks_cadence_step_id_fkey | cadence_step_id | CASCADE |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| cadence_steps_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX cadence_steps_pkey ON _dormant.cadence_steps USING btree (id)` |


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
