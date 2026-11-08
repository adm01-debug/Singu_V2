# public.ai_gateway_metrics

| propriedade | valor |
|---|---|
| tipo | partitioned |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 1 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |
| chave de partição | `RANGE (created_at)` |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `function_name` | `text` | não |  |  |  |
| 3 | `model` | `text` | sim |  |  |  |
| 4 | `status` | `text` | não |  |  |  |
| 5 | `http_status` | `integer` | sim |  |  |  |
| 6 | `duration_ms` | `integer` | não |  |  |  |
| 7 | `tokens_in` | `integer` | sim |  |  |  |
| 8 | `tokens_out` | `integer` | sim |  |  |  |
| 9 | `error_code` | `text` | sim |  |  |  |
| 10 | `error_message` | `text` | sim |  |  |  |
| 11 | `user_id` | `uuid` | sim |  |  |  |
| 12 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| ai_gateway_metrics_duration_ms_check | CHECK | `CHECK (duration_ms >= 0)` |  |  | sim |
| ai_gateway_metrics_pkey | PRIMARY KEY | `PRIMARY KEY (id, created_at)` |  |  | sim |
| ai_gateway_metrics_status_check | CHECK | `CHECK (status = ANY (ARRAY['success'::text, 'error'::text, 'rate_limited'::text, 'timeout'::text]))` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| ai_gateway_metrics_pkey | btree | id, created_at | sim | sim |  | `CREATE UNIQUE INDEX ai_gateway_metrics_pkey ON ONLY public.ai_gateway_metrics USING btree (id, created_at)` |
| idx_ai_gateway_metrics_created | btree | created_at | não | sim |  | `CREATE INDEX idx_ai_gateway_metrics_created ON ONLY public.ai_gateway_metrics USING btree (created_at DESC)` |
| idx_ai_gateway_metrics_fn_created | btree | function_name, created_at | não | sim |  | `CREATE INDEX idx_ai_gateway_metrics_fn_created ON ONLY public.ai_gateway_metrics USING btree (function_name, created_at DESC)` |


## Policies (RLS)

### `Service role manages ai_gateway_metrics`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | service_role |
| USING | `true` |
| WITH CHECK | `true` |


## Triggers

_nenhum_


## Grants

_nenhum_
