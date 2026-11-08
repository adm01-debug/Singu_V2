# _dormant.workflow_triggers

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
| 2 | `workflow_id` | `uuid` | não |  |  |  |
| 3 | `trigger_type` | `workflow_trigger_type` | não |  |  |  |
| 4 | `stage_from_id` | `uuid` | sim |  |  |  |
| 5 | `stage_to_id` | `uuid` | sim |  |  |  |
| 6 | `status_from` | `character varying(50)` | sim |  |  |  |
| 7 | `status_to` | `character varying(50)` | sim |  |  |  |
| 8 | `condicoes` | `jsonb` | sim | `'{}'::jsonb` |  |  |
| 9 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| workflow_triggers_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| workflow_triggers_stage_from_id_fkey | FOREIGN KEY | `FOREIGN KEY (stage_from_id) REFERENCES pipeline_stages(id)` | NO ACTION | NO ACTION | sim |
| workflow_triggers_stage_to_id_fkey | FOREIGN KEY | `FOREIGN KEY (stage_to_id) REFERENCES pipeline_stages(id)` | NO ACTION | NO ACTION | sim |
| workflow_triggers_workflow_id_fkey | FOREIGN KEY | `FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| _dormant.workflow_executions | workflow_executions_trigger_id_fkey | trigger_id | NO ACTION |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| workflow_triggers_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX workflow_triggers_pkey ON _dormant.workflow_triggers USING btree (id)` |


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
