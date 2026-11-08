# _dormant.workflow_actions

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
| 3 | `action_type` | `workflow_action_type` | não |  |  |  |
| 4 | `ordem` | `integer` | sim | `0` |  |  |
| 5 | `config` | `jsonb` | não | `'{}'::jsonb` |  |  |
| 6 | `delay_minutos` | `integer` | sim | `0` |  |  |
| 7 | `condicao` | `jsonb` | sim |  |  |  |
| 8 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| workflow_actions_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| workflow_actions_workflow_id_fkey | FOREIGN KEY | `FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| _dormant.workflow_action_logs | workflow_action_logs_action_id_fkey | action_id | NO ACTION |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| workflow_actions_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX workflow_actions_pkey ON _dormant.workflow_actions USING btree (id)` |


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
