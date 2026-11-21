# public.nurturing_executions

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
| 3 | `workflow_id` | `uuid` | não |  |  |  |
| 4 | `contact_id` | `uuid` | não |  |  |  |
| 5 | `current_step` | `integer` | não | `0` |  |  |
| 6 | `status` | `text` | não | `'active'::text` |  |  |
| 7 | `next_action_at` | `timestamp with time zone` | sim |  |  |  |
| 8 | `last_action_at` | `timestamp with time zone` | sim |  |  |  |
| 9 | `started_at` | `timestamp with time zone` | não | `now()` |  |  |
| 10 | `completed_at` | `timestamp with time zone` | sim |  |  |  |
| 11 | `error_message` | `text` | sim |  |  |  |
| 12 | `context` | `jsonb` | não | `'{}'::jsonb` |  |  |
| 13 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 14 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| nurturing_executions_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| nurturing_executions_status_check | CHECK | `CHECK (status = ANY (ARRAY['active'::text, 'paused'::text, 'completed'::text, 'cancelled'::text, 'failed'::text]))` |  |  | sim |
| nurturing_executions_workflow_id_contact_id_key | UNIQUE | `UNIQUE (workflow_id, contact_id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_ne_next_action | btree | next_action_at | não | sim | `(status = 'active'::text)` | `CREATE INDEX idx_ne_next_action ON public.nurturing_executions USING btree (next_action_at) WHERE (status = 'active'::text)` |
| idx_ne_user | btree | user_id | não | sim |  | `CREATE INDEX idx_ne_user ON public.nurturing_executions USING btree (user_id)` |
| idx_ne_workflow | btree | workflow_id | não | sim |  | `CREATE INDEX idx_ne_workflow ON public.nurturing_executions USING btree (workflow_id)` |
| nurturing_executions_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX nurturing_executions_pkey ON public.nurturing_executions USING btree (id)` |
| nurturing_executions_workflow_id_contact_id_key | btree | workflow_id, contact_id | sim | sim |  | `CREATE UNIQUE INDEX nurturing_executions_workflow_id_contact_id_key ON public.nurturing_executions USING btree (workflow_id, contact_id)` |


## Policies (RLS)

### `ne_owner_all`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| trg_ne_updated | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
