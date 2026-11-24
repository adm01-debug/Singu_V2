# public.system_health_snapshots

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
| 2 | `timestamp` | `timestamp with time zone` | não | `now()` |  |  |
| 3 | `status` | `text` | não |  |  |  |
| 4 | `total_latency_ms` | `integer` | sim |  |  |  |
| 5 | `components` | `jsonb` | não | `'{}'::jsonb` |  |  |
| 6 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| system_health_snapshots_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| system_health_snapshots_status_check | CHECK | `CHECK (status = ANY (ARRAY['healthy'::text, 'degraded'::text, 'unhealthy'::text]))` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_system_health_snapshots_timestamp | btree | timestamp | não | sim |  | `CREATE INDEX idx_system_health_snapshots_timestamp ON public.system_health_snapshots USING btree ("timestamp" DESC)` |
| system_health_snapshots_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX system_health_snapshots_pkey ON public.system_health_snapshots USING btree (id)` |


## Policies (RLS)

### `Admins can view system health snapshots`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)` |
| WITH CHECK |  |

### `Service role can insert system health snapshots`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)` |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
