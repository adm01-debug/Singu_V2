# _dormant.cadence_tasks

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
| 2 | `prospect_cadence_id` | `uuid` | não |  |  |  |
| 3 | `cadence_step_id` | `uuid` | não |  |  |  |
| 4 | `scheduled_date` | `date` | não |  |  |  |
| 5 | `status` | `text` | não | `'pending'::text` |  |  |
| 6 | `completed_at` | `timestamp with time zone` | sim |  |  |  |
| 7 | `notes` | `text` | sim |  |  |  |
| 8 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| cadence_tasks_cadence_step_id_fkey | FOREIGN KEY | `FOREIGN KEY (cadence_step_id) REFERENCES cadence_steps(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| cadence_tasks_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| cadence_tasks_prospect_cadence_id_fkey | FOREIGN KEY | `FOREIGN KEY (prospect_cadence_id) REFERENCES prospect_cadences(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| cadence_tasks_status_check | CHECK | `CHECK (status = ANY (ARRAY['pending'::text, 'completed'::text, 'skipped'::text]))` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| cadence_tasks_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX cadence_tasks_pkey ON _dormant.cadence_tasks USING btree (id)` |


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
