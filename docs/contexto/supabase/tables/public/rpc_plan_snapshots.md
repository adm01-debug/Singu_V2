# public.rpc_plan_snapshots

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
| 2 | `rpc_name` | `text` | não |  |  |  |
| 3 | `plan` | `jsonb` | não |  |  |  |
| 4 | `plan_hash` | `text` | não |  |  |  |
| 5 | `total_cost` | `numeric` | sim |  |  |  |
| 6 | `execution_ms` | `numeric` | sim |  |  |  |
| 7 | `reason` | `text` | não | `'scheduled'::text` |  |  |
| 8 | `plan_changed` | `boolean` | não | `false` |  |  |
| 9 | `captured_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| rpc_plan_snapshots_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_rpc_plan_snapshots_changed | btree | rpc_name, captured_at | não | sim | `plan_changed` | `CREATE INDEX idx_rpc_plan_snapshots_changed ON public.rpc_plan_snapshots USING btree (rpc_name, captured_at DESC) WHERE plan_changed` |
| idx_rpc_plan_snapshots_name_time | btree | rpc_name, captured_at | não | sim |  | `CREATE INDEX idx_rpc_plan_snapshots_name_time ON public.rpc_plan_snapshots USING btree (rpc_name, captured_at DESC)` |
| rpc_plan_snapshots_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX rpc_plan_snapshots_pkey ON public.rpc_plan_snapshots USING btree (id)` |


## Policies (RLS)

### `admins_read_rpc_plan_snapshots`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `has_role(auth.uid(), 'admin'::app_role)` |
| WITH CHECK |  |

### `service_role_writes_rpc_plan_snapshots`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | service_role |
| USING | `true` |
| WITH CHECK | `true` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| trg_rpc_plan_changed | BEFORE | INSERT | ROW | enabled | public.set_rpc_plan_changed |


## Grants

_nenhum_
