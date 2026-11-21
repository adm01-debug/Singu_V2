# public.revops_snapshots

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
| 3 | `period` | `date` | não |  |  |  |
| 4 | `funnel_stage` | `text` | não |  |  |  |
| 5 | `count` | `integer` | não | `0` |  |  |
| 6 | `conversion_rate` | `numeric(5,2)` | sim |  |  |  |
| 7 | `avg_velocity_days` | `numeric(8,2)` | sim |  |  |  |
| 8 | `total_value` | `numeric(14,2)` | sim | `0` |  |  |
| 9 | `captured_at` | `timestamp with time zone` | não | `now()` |  |  |
| 10 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| revops_snapshots_funnel_stage_check | CHECK | `CHECK (funnel_stage = ANY (ARRAY['visitor'::text, 'lead'::text, 'mql'::text, 'sql'::text, 'opportunity'::text, 'customer'::text]))` |  |  | sim |
| revops_snapshots_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| revops_snapshots_user_id_period_funnel_stage_key | UNIQUE | `UNIQUE (user_id, period, funnel_stage)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_revops_snapshots_user_period | btree | user_id, period | não | sim |  | `CREATE INDEX idx_revops_snapshots_user_period ON public.revops_snapshots USING btree (user_id, period DESC)` |
| revops_snapshots_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX revops_snapshots_pkey ON public.revops_snapshots USING btree (id)` |
| revops_snapshots_user_id_period_funnel_stage_key | btree | user_id, period, funnel_stage | sim | sim |  | `CREATE UNIQUE INDEX revops_snapshots_user_id_period_funnel_stage_key ON public.revops_snapshots USING btree (user_id, period, funnel_stage)` |


## Policies (RLS)

### `Users delete own snapshots`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `Users insert own snapshots`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |

### `Users view own snapshots`

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
