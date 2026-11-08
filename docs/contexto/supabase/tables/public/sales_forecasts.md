# public.sales_forecasts

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
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `forecast_month` | `date` | não |  |  |  |
| 3 | `user_id` | `uuid` | não |  |  |  |
| 4 | `forecast_type` | `text` | sim | `'pipeline'::text` |  |  |
| 5 | `predicted_value` | `numeric` | sim | `0` |  |  |
| 6 | `actual_value` | `numeric` | sim |  |  |  |
| 7 | `confidence_level` | `numeric` | sim | `0.5` |  |  |
| 8 | `assumptions` | `jsonb` | sim | `'{}'::jsonb` |  |  |
| 9 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 10 | `updated_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| sales_forecasts_forecast_month_user_id_forecast_type_key | UNIQUE | `UNIQUE (forecast_month, user_id, forecast_type)` |  |  | sim |
| sales_forecasts_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| sales_forecasts_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES profiles(id)` | NO ACTION | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_sales_forecasts_user_id | btree | user_id | não | sim |  | `CREATE INDEX idx_sales_forecasts_user_id ON public.sales_forecasts USING btree (user_id)` |
| sales_forecasts_forecast_month_user_id_forecast_type_key | btree | forecast_month, user_id, forecast_type | sim | sim |  | `CREATE UNIQUE INDEX sales_forecasts_forecast_month_user_id_forecast_type_key ON public.sales_forecasts USING btree (forecast_month, user_id, forecast_type)` |
| sales_forecasts_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX sales_forecasts_pkey ON public.sales_forecasts USING btree (id)` |


## Policies (RLS)

### `Users own data`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| trg_sales_forecasts_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
