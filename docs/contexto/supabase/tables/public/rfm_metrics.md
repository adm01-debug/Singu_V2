# public.rfm_metrics

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 5 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `user_id` | `uuid` | não |  |  |  |
| 3 | `period_start` | `date` | não |  |  |  |
| 4 | `period_end` | `date` | não |  |  |  |
| 5 | `period_type` | `text` | não |  |  |  |
| 6 | `champions_count` | `integer` | sim | `0` |  |  |
| 7 | `loyal_count` | `integer` | sim | `0` |  |  |
| 8 | `potential_loyalist_count` | `integer` | sim | `0` |  |  |
| 9 | `recent_customers_count` | `integer` | sim | `0` |  |  |
| 10 | `promising_count` | `integer` | sim | `0` |  |  |
| 11 | `needing_attention_count` | `integer` | sim | `0` |  |  |
| 12 | `about_to_sleep_count` | `integer` | sim | `0` |  |  |
| 13 | `at_risk_count` | `integer` | sim | `0` |  |  |
| 14 | `cant_lose_count` | `integer` | sim | `0` |  |  |
| 15 | `hibernating_count` | `integer` | sim | `0` |  |  |
| 16 | `lost_count` | `integer` | sim | `0` |  |  |
| 17 | `total_contacts_analyzed` | `integer` | sim | `0` |  |  |
| 18 | `average_rfm_score` | `numeric` | sim |  |  |  |
| 19 | `average_monetary_value` | `numeric` | sim |  |  |  |
| 20 | `total_revenue` | `numeric` | sim |  |  |  |
| 21 | `segment_transitions` | `jsonb` | sim | `'{}'::jsonb` |  |  |
| 22 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| rfm_metrics_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| rfm_metrics_user_id_period_start_period_end_period_type_key | UNIQUE | `UNIQUE (user_id, period_start, period_end, period_type)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_rfm_metrics_period | btree | user_id, period_start, period_end | não | sim |  | `CREATE INDEX idx_rfm_metrics_period ON public.rfm_metrics USING btree (user_id, period_start, period_end)` |
| rfm_metrics_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX rfm_metrics_pkey ON public.rfm_metrics USING btree (id)` |
| rfm_metrics_user_id_period_start_period_end_period_type_key | btree | user_id, period_start, period_end, period_type | sim | sim |  | `CREATE UNIQUE INDEX rfm_metrics_user_id_period_start_period_end_period_type_key ON public.rfm_metrics USING btree (user_id, period_start, period_end, period_type)` |


## Policies (RLS)

### `Users can view their RFM metrics`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(auth.uid() = user_id)` |
| WITH CHECK |  |

### `rfm_metrics_delete`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(user_id = ( SELECT auth.uid() AS uid))` |
| WITH CHECK |  |

### `rfm_metrics_insert`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(user_id = ( SELECT auth.uid() AS uid))` |

### `rfm_metrics_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(user_id = ( SELECT auth.uid() AS uid))` |
| WITH CHECK |  |

### `rfm_metrics_update`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(user_id = ( SELECT auth.uid() AS uid))` |
| WITH CHECK | `(user_id = ( SELECT auth.uid() AS uid))` |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
