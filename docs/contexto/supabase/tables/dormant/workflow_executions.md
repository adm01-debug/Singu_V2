# _dormant.workflow_executions

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
| 3 | `lead_id` | `uuid` | sim |  |  |  |
| 4 | `deal_id` | `uuid` | sim |  |  |  |
| 5 | `trigger_id` | `uuid` | sim |  |  |  |
| 6 | `trigger_data` | `jsonb` | sim |  |  |  |
| 7 | `status` | `character varying(20)` | sim | `'pendente'::character varying` |  |  |
| 8 | `resultado` | `jsonb` | sim |  |  |  |
| 9 | `erro` | `text` | sim |  |  |  |
| 10 | `started_at` | `timestamp with time zone` | sim |  |  |  |
| 11 | `completed_at` | `timestamp with time zone` | sim |  |  |  |
| 12 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| workflow_executions_deal_id_fkey | FOREIGN KEY | `FOREIGN KEY (deal_id) REFERENCES _dormant.deals(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| workflow_executions_lead_id_fkey | FOREIGN KEY | `FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| workflow_executions_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| workflow_executions_trigger_id_fkey | FOREIGN KEY | `FOREIGN KEY (trigger_id) REFERENCES workflow_triggers(id)` | NO ACTION | NO ACTION | sim |
| workflow_executions_workflow_id_fkey | FOREIGN KEY | `FOREIGN KEY (workflow_id) REFERENCES workflows(id)` | NO ACTION | NO ACTION | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| _dormant.workflow_action_logs | workflow_action_logs_execution_id_fkey | execution_id | CASCADE |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| workflow_executions_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX workflow_executions_pkey ON _dormant.workflow_executions USING btree (id)` |


## Policies (RLS)

> ⚠️ RLS **desabilitado** nesta tabela.



## Triggers

_nenhum_


## Grants

_nenhum_
