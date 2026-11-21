# public.lead_score_config

> SINGU: Config de pesos e thresholds do lead scoring por usuário. Soma dos 4 pesos = 1.00. Thresholds ordenados crescente.

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 7 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `user_id` | `uuid` | não |  |  |  |
| 3 | `weight_engagement` | `numeric(3,2)` | não | `0.30` |  |  |
| 4 | `weight_fit` | `numeric(3,2)` | não | `0.20` |  |  |
| 5 | `weight_intent` | `numeric(3,2)` | não | `0.25` |  |  |
| 6 | `weight_relationship` | `numeric(3,2)` | não | `0.25` |  |  |
| 7 | `threshold_warm` | `integer` | não | `30` |  |  |
| 8 | `threshold_hot` | `integer` | não | `60` |  |  |
| 9 | `threshold_on_fire` | `integer` | não | `85` |  |  |
| 10 | `auto_recalculate` | `boolean` | sim | `true` |  |  |
| 11 | `recalculate_interval_hours` | `integer` | sim | `6` |  |  |
| 12 | `last_recalculated_at` | `timestamp with time zone` | sim |  |  |  |
| 13 | `custom_factors` | `jsonb` | sim | `'{}'::jsonb` |  |  |
| 14 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 15 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |
| 16 | `grade_thresholds` | `jsonb` | não | `'{"hot": 60, "cold": 0, "warm": 30, "on_fire": 85}'::jsonb` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| lead_score_config_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| lead_score_config_threshold_hot_check | CHECK | `CHECK (threshold_hot >= 0 AND threshold_hot <= 100)` |  |  | sim |
| lead_score_config_threshold_on_fire_check | CHECK | `CHECK (threshold_on_fire >= 0 AND threshold_on_fire <= 100)` |  |  | sim |
| lead_score_config_threshold_warm_check | CHECK | `CHECK (threshold_warm >= 0 AND threshold_warm <= 100)` |  |  | sim |
| lead_score_config_user_id_key | UNIQUE | `UNIQUE (user_id)` |  |  | sim |
| lead_score_config_weight_engagement_check | CHECK | `CHECK (weight_engagement >= 0::numeric AND weight_engagement <= 1::numeric)` |  |  | sim |
| lead_score_config_weight_fit_check | CHECK | `CHECK (weight_fit >= 0::numeric AND weight_fit <= 1::numeric)` |  |  | sim |
| lead_score_config_weight_intent_check | CHECK | `CHECK (weight_intent >= 0::numeric AND weight_intent <= 1::numeric)` |  |  | sim |
| lead_score_config_weight_relationship_check | CHECK | `CHECK (weight_relationship >= 0::numeric AND weight_relationship <= 1::numeric)` |  |  | sim |
| thresholds_ordered | CHECK | `CHECK (threshold_warm < threshold_hot AND threshold_hot < threshold_on_fire)` |  |  | sim |
| weights_sum_one | CHECK | `CHECK (round(weight_engagement + weight_fit + weight_intent + weight_relationship, 2) = 1.00)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| lead_score_config_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX lead_score_config_pkey ON public.lead_score_config USING btree (id)` |
| lead_score_config_user_id_key | btree | user_id | sim | sim |  | `CREATE UNIQUE INDEX lead_score_config_user_id_key ON public.lead_score_config USING btree (user_id)` |


## Policies (RLS)

### `Users can delete own`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `Users can insert own`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |

### `Users can insert their own config`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |

### `Users can update own`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |

### `Users can update their own config`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `Users can view own`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `Users can view their own config`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| update_lead_score_config_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
