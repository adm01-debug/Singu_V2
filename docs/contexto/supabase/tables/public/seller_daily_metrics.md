# public.seller_daily_metrics

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
| 2 | `user_id` | `uuid` | não |  |  |  |
| 3 | `metric_date` | `date` | sim | `CURRENT_DATE` |  |  |
| 4 | `interactions_count` | `integer` | sim | `0` |  |  |
| 5 | `calls_count` | `integer` | sim | `0` |  |  |
| 6 | `emails_count` | `integer` | sim | `0` |  |  |
| 7 | `whatsapp_count` | `integer` | sim | `0` |  |  |
| 8 | `meetings_count` | `integer` | sim | `0` |  |  |
| 9 | `deals_created` | `integer` | sim | `0` |  |  |
| 10 | `deals_won` | `integer` | sim | `0` |  |  |
| 11 | `deals_lost` | `integer` | sim | `0` |  |  |
| 12 | `revenue_generated` | `numeric` | sim | `0` |  |  |
| 13 | `new_companies` | `integer` | sim | `0` |  |  |
| 14 | `followups_completed` | `integer` | sim | `0` |  |  |
| 15 | `avg_response_time_minutes` | `integer` | sim |  |  |  |
| 16 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| seller_daily_metrics_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| seller_daily_metrics_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES profiles(id)` | NO ACTION | NO ACTION | sim |
| seller_daily_metrics_user_id_metric_date_key | UNIQUE | `UNIQUE (user_id, metric_date)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_seller_daily_metrics_user_id | btree | user_id | não | sim |  | `CREATE INDEX idx_seller_daily_metrics_user_id ON public.seller_daily_metrics USING btree (user_id)` |
| seller_daily_metrics_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX seller_daily_metrics_pkey ON public.seller_daily_metrics USING btree (id)` |
| seller_daily_metrics_user_id_metric_date_key | btree | user_id, metric_date | sim | sim |  | `CREATE UNIQUE INDEX seller_daily_metrics_user_id_metric_date_key ON public.seller_daily_metrics USING btree (user_id, metric_date)` |


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

_nenhum_


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
