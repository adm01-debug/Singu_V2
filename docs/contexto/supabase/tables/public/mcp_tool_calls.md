# public.mcp_tool_calls

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


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `connection_id` | `uuid` | sim |  |  |  |
| 3 | `tool_name` | `text` | não |  |  |  |
| 4 | `arguments_summary` | `jsonb` | não | `'{}'::jsonb` |  |  |
| 5 | `status` | `text` | não |  |  |  |
| 6 | `error_message` | `text` | sim |  |  |  |
| 7 | `latency_ms` | `integer` | sim |  |  |  |
| 8 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| mcp_tool_calls_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| mcp_tool_calls_status_check | CHECK | `CHECK (status = ANY (ARRAY['success'::text, 'error'::text, 'denied'::text]))` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| mcp_tool_calls_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX mcp_tool_calls_pkey ON public.mcp_tool_calls USING btree (id)` |


## Policies (RLS)

### `Admins read mcp_tool_calls`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)` |
| WITH CHECK |  |

### `Service role insert mcp_tool_calls`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | service_role |
| USING |  |
| WITH CHECK | `true` |


## Triggers

_nenhum_


## Grants

_nenhum_
