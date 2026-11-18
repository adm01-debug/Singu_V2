# public.churn_risk_scores

> SINGU: Histórico de scores de risco de churn (análise local, 5 fatores). Espelha feature churn-risk-detection das memories. is_current=true para score atual.

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 6 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `user_id` | `uuid` | não |  |  |  |
| 3 | `contact_id` | `uuid` | sim |  |  |  |
| 4 | `company_id` | `uuid` | sim |  |  |  |
| 5 | `risk_score` | `integer` | não |  |  |  |
| 6 | `risk_level` | `text` | não |  |  |  |
| 7 | `factors_detected` | `jsonb` | sim | `'[]'::jsonb` |  |  |
| 8 | `factors_breakdown` | `jsonb` | sim | `'{}'::jsonb` |  |  |
| 9 | `recommended_actions` | `jsonb` | sim | `'[]'::jsonb` |  |  |
| 10 | `confidence` | `integer` | sim | `70` |  |  |
| 11 | `previous_score` | `integer` | sim |  |  |  |
| 12 | `calculated_at` | `timestamp with time zone` | não | `now()` |  |  |
| 13 | `is_current` | `boolean` | sim | `true` |  |  |
| 14 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 15 | `risk_factors` | `jsonb` | não | `'[]'::jsonb` |  |  |
| 16 | `recommendations` | `text[]` | sim | `'{}'::text[]` |  |  |
| 17 | `days_since_last_interaction` | `integer` | sim |  |  |  |
| 18 | `sentiment_trend` | `text` | sim |  |  |  |
| 19 | `score_trend` | `text` | sim |  |  |  |
| 20 | `analyzed_at` | `timestamp with time zone` | não | `now()` |  |  |
| 21 | `expires_at` | `timestamp with time zone` | não | `(now() + '7 days'::interval)` |  |  |
| 22 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| churn_risk_either_contact_or_company | CHECK | `CHECK (contact_id IS NOT NULL OR company_id IS NOT NULL)` |  |  | sim |
| churn_risk_scores_confidence_check | CHECK | `CHECK (confidence >= 0 AND confidence <= 100)` |  |  | sim |
| churn_risk_scores_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| churn_risk_scores_risk_level_check | CHECK | `CHECK (risk_level = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text, 'critical'::text]))` |  |  | sim |
| churn_risk_scores_risk_score_check | CHECK | `CHECK (risk_score >= 0 AND risk_score <= 100)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| churn_risk_scores_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX churn_risk_scores_pkey ON public.churn_risk_scores USING btree (id)` |
| idx_churn_risk_contact | btree | contact_id | não | sim |  | `CREATE INDEX idx_churn_risk_contact ON public.churn_risk_scores USING btree (contact_id)` |
| idx_churn_risk_level | btree | risk_level | não | sim |  | `CREATE INDEX idx_churn_risk_level ON public.churn_risk_scores USING btree (risk_level)` |
| idx_churn_risk_user | btree | user_id | não | sim |  | `CREATE INDEX idx_churn_risk_user ON public.churn_risk_scores USING btree (user_id)` |


## Policies (RLS)

### `Users can create their own churn risks`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | public |
| USING |  |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |

### `Users can delete their own churn risks`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | public |
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

### `Users can update their own churn risks`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | public |
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

### `Users can view their own churn risks`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | public |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| update_churn_risk_scores_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
