# _dormant.prospect_cadences

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
| 2 | `sale_id` | `uuid` | não |  |  |  |
| 3 | `cadence_id` | `uuid` | não |  |  |  |
| 4 | `salesperson_id` | `uuid` | sim |  |  |  |
| 5 | `status` | `text` | não | `'active'::text` |  |  |
| 6 | `started_at` | `timestamp with time zone` | não | `now()` |  |  |
| 7 | `current_step` | `integer` | não | `0` |  |  |
| 8 | `next_action_date` | `date` | sim |  |  |  |
| 9 | `completed_at` | `timestamp with time zone` | sim |  |  |  |
| 10 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 11 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| prospect_cadences_cadence_id_fkey | FOREIGN KEY | `FOREIGN KEY (cadence_id) REFERENCES cadences(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| prospect_cadences_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| prospect_cadences_sale_id_cadence_id_key | UNIQUE | `UNIQUE (sale_id, cadence_id)` |  |  | sim |
| prospect_cadences_sale_id_fkey | FOREIGN KEY | `FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| prospect_cadences_salesperson_id_fkey | FOREIGN KEY | `FOREIGN KEY (salesperson_id) REFERENCES salespeople(id)` | NO ACTION | NO ACTION | sim |
| prospect_cadences_status_check | CHECK | `CHECK (status = ANY (ARRAY['active'::text, 'paused'::text, 'completed'::text, 'cancelled'::text]))` |  |  | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| _dormant.cadence_tasks | cadence_tasks_prospect_cadence_id_fkey | prospect_cadence_id | CASCADE |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| prospect_cadences_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX prospect_cadences_pkey ON _dormant.prospect_cadences USING btree (id)` |
| prospect_cadences_sale_id_cadence_id_key | btree | sale_id, cadence_id | sim | sim |  | `CREATE UNIQUE INDEX prospect_cadences_sale_id_cadence_id_key ON _dormant.prospect_cadences USING btree (sale_id, cadence_id)` |


## Policies (RLS)

> ⚠️ RLS **desabilitado** nesta tabela.



## Triggers

_nenhum_


## Grants

_nenhum_
