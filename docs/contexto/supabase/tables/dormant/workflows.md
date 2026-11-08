# _dormant.workflows

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
| 2 | `nome` | `character varying(255)` | não |  |  |  |
| 3 | `descricao` | `text` | sim |  |  |  |
| 4 | `tipo` | `character varying(50)` | não |  |  |  |
| 5 | `pipeline_id` | `uuid` | sim |  |  |  |
| 6 | `is_active` | `boolean` | sim | `true` |  |  |
| 7 | `condicoes` | `jsonb` | sim | `'{}'::jsonb` |  |  |
| 8 | `ordem` | `integer` | sim | `0` |  |  |
| 9 | `created_by` | `uuid` | sim |  |  |  |
| 10 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 11 | `updated_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| workflows_pipeline_id_fkey | FOREIGN KEY | `FOREIGN KEY (pipeline_id) REFERENCES pipelines(id)` | NO ACTION | NO ACTION | sim |
| workflows_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| _dormant.workflow_actions | workflow_actions_workflow_id_fkey | workflow_id | CASCADE |
| _dormant.workflow_executions | workflow_executions_workflow_id_fkey | workflow_id | NO ACTION |
| _dormant.workflow_triggers | workflow_triggers_workflow_id_fkey | workflow_id | CASCADE |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| workflows_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX workflows_pkey ON _dormant.workflows USING btree (id)` |


## Policies (RLS)

> ⚠️ RLS **desabilitado** nesta tabela.



## Triggers

_nenhum_


## Grants

_nenhum_
