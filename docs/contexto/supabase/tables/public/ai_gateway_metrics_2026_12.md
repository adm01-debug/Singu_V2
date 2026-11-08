# public.ai_gateway_metrics_2026_12

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 0 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |
| partição de | public.ai_gateway_metrics |
| bound | `FOR VALUES FROM ('2026-12-01 00:00:00+00') TO ('2027-01-01 00:00:00+00')` |


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
| ai_gateway_metrics_2026_12_pkey | PRIMARY KEY | `PRIMARY KEY (id, created_at)` |  |  | sim |
| ai_gateway_metrics_duration_ms_check | CHECK | `CHECK (duration_ms >= 0)` |  |  | sim |
| ai_gateway_metrics_status_check | CHECK | `CHECK (status = ANY (ARRAY['success'::text, 'error'::text, 'rate_limited'::text, 'timeout'::text]))` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| ai_gateway_metrics_2026_12_created_at_idx | btree | created_at | não | sim |  | `CREATE INDEX ai_gateway_metrics_2026_12_created_at_idx ON public.ai_gateway_metrics_2026_12 USING btree (created_at DESC)` |
| ai_gateway_metrics_2026_12_function_name_created_at_idx | btree | function_name, created_at | não | sim |  | `CREATE INDEX ai_gateway_metrics_2026_12_function_name_created_at_idx ON public.ai_gateway_metrics_2026_12 USING btree (function_name, created_at DESC)` |
| ai_gateway_metrics_2026_12_pkey | btree | id, created_at | sim | sim |  | `CREATE UNIQUE INDEX ai_gateway_metrics_2026_12_pkey ON public.ai_gateway_metrics_2026_12 USING btree (id, created_at)` |


## Policies (RLS)

> ⚠️ RLS habilitado **sem policies**: nenhum acesso via API (anon/authenticated).



## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
