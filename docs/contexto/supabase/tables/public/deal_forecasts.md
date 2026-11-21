# public.deal_forecasts

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
| 3 | `deal_id` | `text` | não |  |  |  |
| 4 | `deal_name` | `text` | sim |  |  |  |
| 5 | `contact_id` | `uuid` | sim |  |  |  |
| 6 | `company_id` | `uuid` | sim |  |  |  |
| 7 | `period_id` | `uuid` | não |  |  |  |
| 8 | `category` | `text` | não | `'pipeline'::text` |  |  |
| 9 | `confidence_score` | `integer` | não | `50` |  |  |
| 10 | `forecasted_amount` | `numeric` | não | `0` |  |  |
| 11 | `forecasted_close_date` | `date` | sim |  |  |  |
| 12 | `stage` | `text` | sim |  |  |  |
| 13 | `risk_factors` | `jsonb` | não | `'[]'::jsonb` |  |  |
| 14 | `health_score` | `integer` | não | `50` |  |  |
| 15 | `last_activity_at` | `timestamp with time zone` | sim |  |  |  |
| 16 | `slip_count` | `integer` | não | `0` |  |  |
| 17 | `ai_rationale` | `text` | sim |  |  |  |
| 18 | `notes` | `text` | sim |  |  |  |
| 19 | `analyzed_at` | `timestamp with time zone` | sim |  |  |  |
| 20 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 21 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| deal_forecasts_category_check | CHECK | `CHECK (category = ANY (ARRAY['commit'::text, 'best_case'::text, 'pipeline'::text, 'omitted'::text]))` |  |  | sim |
| deal_forecasts_confidence_score_check | CHECK | `CHECK (confidence_score >= 0 AND confidence_score <= 100)` |  |  | sim |
| deal_forecasts_deal_id_period_id_key | UNIQUE | `UNIQUE (deal_id, period_id)` |  |  | sim |
| deal_forecasts_health_score_check | CHECK | `CHECK (health_score >= 0 AND health_score <= 100)` |  |  | sim |
| deal_forecasts_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| deal_forecasts_deal_id_period_id_key | btree | deal_id, period_id | sim | sim |  | `CREATE UNIQUE INDEX deal_forecasts_deal_id_period_id_key ON public.deal_forecasts USING btree (deal_id, period_id)` |
| deal_forecasts_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX deal_forecasts_pkey ON public.deal_forecasts USING btree (id)` |


## Policies (RLS)

### `own deal_forecasts delete`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `own deal_forecasts insert`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |

### `own deal_forecasts select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `own deal_forecasts update`

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
| trg_deal_forecasts_audit | AFTER | INSERT OR DELETE OR UPDATE | ROW | enabled | public.audit_trigger_fn |
| trg_deal_forecasts_cat_history | AFTER | UPDATE | ROW | enabled | public.log_deal_forecast_category_change |
| trg_deal_forecasts_updated | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
