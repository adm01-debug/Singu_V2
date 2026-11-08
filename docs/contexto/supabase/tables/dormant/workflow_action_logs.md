# _dormant.workflow_action_logs

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
| 2 | `execution_id` | `uuid` | não |  |  |  |
| 3 | `action_id` | `uuid` | não |  |  |  |
| 4 | `status` | `character varying(20)` | sim |  |  |  |
| 5 | `resultado` | `jsonb` | sim |  |  |  |
| 6 | `erro` | `text` | sim |  |  |  |
| 7 | `executed_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| workflow_action_logs_action_id_fkey | FOREIGN KEY | `FOREIGN KEY (action_id) REFERENCES workflow_actions(id)` | NO ACTION | NO ACTION | sim |
| workflow_action_logs_execution_id_fkey | FOREIGN KEY | `FOREIGN KEY (execution_id) REFERENCES workflow_executions(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| workflow_action_logs_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| workflow_action_logs_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX workflow_action_logs_pkey ON _dormant.workflow_action_logs USING btree (id)` |


## Policies (RLS)

> ⚠️ RLS **desabilitado** nesta tabela.



## Triggers

_nenhum_


## Grants

_nenhum_
