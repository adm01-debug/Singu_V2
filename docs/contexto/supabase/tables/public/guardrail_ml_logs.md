# public.guardrail_ml_logs

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 2 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |
| usada por views | public.v_guardrail_dashboard |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `workspace_id` | `uuid` | sim |  |  |  |
| 3 | `agent_id` | `uuid` | sim |  |  |  |
| 4 | `direction` | `text` | não |  |  |  |
| 5 | `text_preview` | `text` | sim |  |  |  |
| 6 | `all_passed` | `boolean` | não | `true` |  |  |
| 7 | `blocked_layers` | `text[]` | sim | `'{}'::text[]` |  |  |
| 8 | `scores` | `jsonb` | sim | `'{}'::jsonb` |  |  |
| 9 | `latency_ms` | `integer` | sim |  |  |  |
| 10 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| guardrail_ml_logs_direction_check | CHECK | `CHECK (direction = ANY (ARRAY['input'::text, 'output'::text]))` |  |  | sim |
| guardrail_ml_logs_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| guardrail_ml_logs_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX guardrail_ml_logs_pkey ON public.guardrail_ml_logs USING btree (id)` |


## Policies (RLS)

### `guardrail_ml_logs_insert`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |

### `guardrail_ml_logs_select`

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
