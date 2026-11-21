# public.crm_cadence_rules

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
| 2 | `user_id` | `uuid` | não |  |  |  |
| 3 | `relationship_stage` | `text` | não |  |  |  |
| 4 | `frequency_days` | `integer` | não |  |  |  |
| 5 | `priority` | `text` | sim | `'medium'::text` |  |  |
| 6 | `suggested_actions` | `text[]` | sim |  |  |  |
| 7 | `is_active` | `boolean` | sim | `true` |  |  |
| 8 | `version` | `integer` | sim | `1` |  |  |
| 9 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 10 | `updated_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 11 | `cadence_steps` | `jsonb` | sim | `'[]'::jsonb` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| crm_cadence_rules_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| crm_cadence_rules_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES auth.users(id)` | NO ACTION | NO ACTION | sim |
| crm_cadence_rules_user_id_relationship_stage_version_key | UNIQUE | `UNIQUE (user_id, relationship_stage, version)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| crm_cadence_rules_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX crm_cadence_rules_pkey ON public.crm_cadence_rules USING btree (id)` |
| crm_cadence_rules_user_id_relationship_stage_version_key | btree | user_id, relationship_stage, version | sim | sim |  | `CREATE UNIQUE INDEX crm_cadence_rules_user_id_relationship_stage_version_key ON public.crm_cadence_rules USING btree (user_id, relationship_stage, version)` |


## Policies (RLS)

### `Users can manage their own cadence rules`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
