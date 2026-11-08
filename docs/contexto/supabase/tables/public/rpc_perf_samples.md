# public.rpc_perf_samples

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
| 1 | `id` | `bigint` | não | `nextval('rpc_perf_samples_id_seq'::regclass)` |  |  |
| 2 | `rpc_name` | `text` | não |  |  |  |
| 3 | `duration_ms` | `numeric` | não |  |  |  |
| 4 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| rpc_perf_samples_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| rpc_perf_samples_name_time_idx | btree | rpc_name, created_at | não | sim |  | `CREATE INDEX rpc_perf_samples_name_time_idx ON public.rpc_perf_samples USING btree (rpc_name, created_at DESC)` |
| rpc_perf_samples_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX rpc_perf_samples_pkey ON public.rpc_perf_samples USING btree (id)` |


## Policies (RLS)

### `Admins read perf samples`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `has_role(auth.uid(), 'admin'::app_role)` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

_nenhum_
