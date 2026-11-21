# public.forecast_snapshots

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 3 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `user_id` | `uuid` | não |  |  |  |
| 3 | `period_id` | `uuid` | não |  |  |  |
| 4 | `snapshot_date` | `date` | não | `CURRENT_DATE` |  |  |
| 5 | `commit_total` | `numeric` | não | `0` |  |  |
| 6 | `best_case_total` | `numeric` | não | `0` |  |  |
| 7 | `pipeline_total` | `numeric` | não | `0` |  |  |
| 8 | `weighted_total` | `numeric` | não | `0` |  |  |
| 9 | `deal_count` | `integer` | não | `0` |  |  |
| 10 | `snapshot_data` | `jsonb` | não | `'{}'::jsonb` |  |  |
| 11 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| forecast_snapshots_period_id_snapshot_date_key | UNIQUE | `UNIQUE (period_id, snapshot_date)` |  |  | sim |
| forecast_snapshots_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| forecast_snapshots_period_id_snapshot_date_key | btree | period_id, snapshot_date | sim | sim |  | `CREATE UNIQUE INDEX forecast_snapshots_period_id_snapshot_date_key ON public.forecast_snapshots USING btree (period_id, snapshot_date)` |
| forecast_snapshots_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX forecast_snapshots_pkey ON public.forecast_snapshots USING btree (id)` |
| idx_forecast_snapshots_period | btree | period_id, snapshot_date | não | sim |  | `CREATE INDEX idx_forecast_snapshots_period ON public.forecast_snapshots USING btree (period_id, snapshot_date DESC)` |


## Policies (RLS)

### `own forecast_snapshots delete`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `own forecast_snapshots insert`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |

### `own forecast_snapshots select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
