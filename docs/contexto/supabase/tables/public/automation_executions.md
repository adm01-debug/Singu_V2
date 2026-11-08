# public.automation_executions

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
| 2 | `rule_id` | `uuid` | sim |  |  |  |
| 3 | `trigger_type` | `text` | não |  |  |  |
| 4 | `entity_type` | `text` | sim |  |  |  |
| 5 | `entity_id` | `uuid` | sim |  |  |  |
| 6 | `input_data` | `jsonb` | sim |  |  |  |
| 7 | `actions_executed` | `jsonb` | sim |  |  |  |
| 8 | `status` | `text` | sim | `'pending'::text` |  |  |
| 9 | `error_message` | `text` | sim |  |  |  |
| 10 | `execution_time_ms` | `integer` | sim |  |  |  |
| 11 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| automation_executions_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| automation_executions_rule_id_fkey | FOREIGN KEY | `FOREIGN KEY (rule_id) REFERENCES automation_rules(id)` | NO ACTION | NO ACTION | sim |
| chk_automation_executions_status | CHECK | `CHECK (status = ANY (ARRAY['pending'::text, 'running'::text, 'completed'::text, 'failed'::text, 'cancelled'::text]))` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| automation_executions_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX automation_executions_pkey ON public.automation_executions USING btree (id)` |
| idx_automation_executions_rule_id | btree | rule_id | não | sim |  | `CREATE INDEX idx_automation_executions_rule_id ON public.automation_executions USING btree (rule_id)` |
| idx_automation_executions_status | btree | status, created_at | não | sim |  | `CREATE INDEX idx_automation_executions_status ON public.automation_executions USING btree (status, created_at)` |


## Policies (RLS)

### `Authenticated read`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

_nenhum_
