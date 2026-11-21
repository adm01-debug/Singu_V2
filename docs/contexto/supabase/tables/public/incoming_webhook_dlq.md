# public.incoming_webhook_dlq

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
| 2 | `webhook_id` | `uuid` | não |  |  |  |
| 3 | `payload` | `jsonb` | não | `'{}'::jsonb` |  |  |
| 4 | `source_ip` | `text` | sim |  |  |  |
| 5 | `user_agent` | `text` | sim |  |  |  |
| 6 | `attempts` | `integer` | não | `0` |  |  |
| 7 | `max_attempts` | `integer` | não | `5` |  |  |
| 8 | `next_retry_at` | `timestamp with time zone` | não | `now()` |  |  |
| 9 | `last_error` | `text` | sim |  |  |  |
| 10 | `status` | `text` | não | `'pending'::text` |  |  |
| 11 | `resolved_at` | `timestamp with time zone` | sim |  |  |  |
| 12 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 13 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| incoming_webhook_dlq_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| incoming_webhook_dlq_status_check | CHECK | `CHECK (status = ANY (ARRAY['pending'::text, 'processing'::text, 'succeeded'::text, 'failed'::text, 'abandoned'::text]))` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_dlq_status_retry | btree | status, next_retry_at | não | sim |  | `CREATE INDEX idx_dlq_status_retry ON public.incoming_webhook_dlq USING btree (status, next_retry_at)` |
| idx_dlq_webhook_id | btree | webhook_id | não | sim |  | `CREATE INDEX idx_dlq_webhook_id ON public.incoming_webhook_dlq USING btree (webhook_id)` |
| incoming_webhook_dlq_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX incoming_webhook_dlq_pkey ON public.incoming_webhook_dlq USING btree (id)` |


## Policies (RLS)

### `Admins manage DLQ`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)` |
| WITH CHECK | `has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| trg_dlq_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
