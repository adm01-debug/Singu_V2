# public.forecast_periods

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 4 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `user_id` | `uuid` | não |  |  |  |
| 3 | `period_type` | `text` | não |  |  |  |
| 4 | `period_start` | `date` | não |  |  |  |
| 5 | `period_end` | `date` | não |  |  |  |
| 6 | `quota_amount` | `numeric` | não | `0` |  |  |
| 7 | `actual_won_amount` | `numeric` | não | `0` |  |  |
| 8 | `status` | `text` | não | `'open'::text` |  |  |
| 9 | `closed_at` | `timestamp with time zone` | sim |  |  |  |
| 10 | `notes` | `text` | sim |  |  |  |
| 11 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 12 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| forecast_periods_period_type_check | CHECK | `CHECK (period_type = ANY (ARRAY['month'::text, 'quarter'::text]))` |  |  | sim |
| forecast_periods_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| forecast_periods_status_check | CHECK | `CHECK (status = ANY (ARRAY['open'::text, 'closed'::text]))` |  |  | sim |
| forecast_periods_user_id_period_type_period_start_key | UNIQUE | `UNIQUE (user_id, period_type, period_start)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| forecast_periods_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX forecast_periods_pkey ON public.forecast_periods USING btree (id)` |
| forecast_periods_user_id_period_type_period_start_key | btree | user_id, period_type, period_start | sim | sim |  | `CREATE UNIQUE INDEX forecast_periods_user_id_period_type_period_start_key ON public.forecast_periods USING btree (user_id, period_type, period_start)` |
| idx_forecast_periods_user | btree | user_id, status, period_start | não | sim |  | `CREATE INDEX idx_forecast_periods_user ON public.forecast_periods USING btree (user_id, status, period_start DESC)` |


## Policies (RLS)

### `own forecast_periods delete`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `own forecast_periods insert`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |

### `own forecast_periods select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `own forecast_periods update`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| trg_forecast_periods_updated | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
