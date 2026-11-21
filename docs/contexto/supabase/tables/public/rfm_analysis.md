# public.rfm_analysis

> SINGU: Análise RFM corrente por empresa (1 registro por company_id). Snapshot atual. Série histórica vai em rfm_history. Configuração de segmentos em rfm_segment_config. Segments typical: Champions, Loyal, At Risk, Lost, New, Promising, Need Attention, About to Sleep, Cannot Lose Them, Hibernating.

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
| 3 | `company_id` | `uuid` | sim |  |  |  |
| 4 | `recency_score` | `integer` | não |  |  |  |
| 5 | `frequency_score` | `integer` | não |  |  |  |
| 6 | `monetary_score` | `integer` | não |  |  |  |
| 7 | `rfm_score` | `text` | sim | `(((recency_score)::text \|\| (frequency_score)::text) \|\| (monetary_score)::text)` | s |  |
| 8 | `rfm_total` | `integer` | sim | `((recency_score + frequency_score) + monetary_score)` | s |  |
| 9 | `segment_code` | `text` | não |  |  |  |
| 10 | `segment_name` | `text` | sim |  |  |  |
| 11 | `days_since_last_purchase` | `integer` | sim |  |  |  |
| 12 | `purchase_count` | `integer` | sim | `0` |  |  |
| 13 | `total_revenue` | `numeric(15,2)` | sim | `0` |  |  |
| 14 | `avg_ticket` | `numeric(15,2)` | sim | `0` |  |  |
| 15 | `previous_segment` | `text` | sim |  |  |  |
| 16 | `segment_changed_at` | `timestamp with time zone` | sim |  |  |  |
| 17 | `trend` | `text` | sim |  |  |  |
| 18 | `recommended_actions` | `jsonb` | sim | `'[]'::jsonb` |  |  |
| 19 | `churn_risk_score` | `integer` | sim |  |  |  |
| 20 | `analyzed_at` | `timestamp with time zone` | não | `now()` |  |  |
| 21 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 22 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |
| 23 | `contact_id` | `uuid` | sim |  |  |  |
| 24 | `total_score` | `integer` | sim | `((recency_score + frequency_score) + monetary_score)` | s |  |
| 25 | `days_since_last_interaction` | `integer` | sim |  |  |  |
| 26 | `total_purchases` | `integer` | sim | `0` |  |  |
| 27 | `total_interactions` | `integer` | sim | `0` |  |  |
| 28 | `total_monetary_value` | `numeric(12,2)` | sim | `0` |  |  |
| 29 | `average_order_value` | `numeric(12,2)` | sim | `0` |  |  |
| 30 | `segment` | `text` | sim |  |  |  |
| 31 | `segment_description` | `text` | sim |  |  |  |
| 32 | `segment_color` | `text` | sim |  |  |  |
| 33 | `recency_trend` | `text` | sim |  |  |  |
| 34 | `frequency_trend` | `text` | sim |  |  |  |
| 35 | `monetary_trend` | `text` | sim |  |  |  |
| 36 | `overall_trend` | `text` | sim |  |  |  |
| 37 | `predicted_next_purchase_date` | `date` | sim |  |  |  |
| 38 | `predicted_lifetime_value` | `numeric(12,2)` | sim |  |  |  |
| 39 | `churn_probability` | `numeric(5,2)` | sim |  |  |  |
| 40 | `recommended_offers` | `jsonb` | sim | `'[]'::jsonb` |  |  |
| 41 | `communication_priority` | `text` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| rfm_analysis_churn_risk_score_check | CHECK | `CHECK (churn_risk_score >= 0 AND churn_risk_score <= 100)` |  |  | sim |
| rfm_analysis_contact_id_fkey | FOREIGN KEY | `FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| rfm_analysis_entity_check | CHECK | `CHECK (company_id IS NOT NULL OR contact_id IS NOT NULL)` |  |  | sim |
| rfm_analysis_frequency_score_check | CHECK | `CHECK (frequency_score >= 1 AND frequency_score <= 5)` |  |  | sim |
| rfm_analysis_monetary_score_check | CHECK | `CHECK (monetary_score >= 1 AND monetary_score <= 5)` |  |  | sim |
| rfm_analysis_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| rfm_analysis_recency_score_check | CHECK | `CHECK (recency_score >= 1 AND recency_score <= 5)` |  |  | sim |
| rfm_analysis_trend_check | CHECK | `CHECK (trend = ANY (ARRAY['up'::text, 'down'::text, 'stable'::text, 'new'::text, 'churning'::text]))` |  |  | sim |
| unique_rfm_analysis_company | UNIQUE | `UNIQUE (user_id, company_id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_rfm_analysis_contact | btree | contact_id | não | sim |  | `CREATE INDEX idx_rfm_analysis_contact ON public.rfm_analysis USING btree (contact_id)` |
| idx_rfm_analysis_scores | btree | recency_score, frequency_score, monetary_score | não | sim |  | `CREATE INDEX idx_rfm_analysis_scores ON public.rfm_analysis USING btree (recency_score, frequency_score, monetary_score)` |
| idx_rfm_analysis_segment | btree | segment | não | sim |  | `CREATE INDEX idx_rfm_analysis_segment ON public.rfm_analysis USING btree (segment)` |
| idx_rfm_analysis_user | btree | user_id | não | sim |  | `CREATE INDEX idx_rfm_analysis_user ON public.rfm_analysis USING btree (user_id)` |
| rfm_analysis_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX rfm_analysis_pkey ON public.rfm_analysis USING btree (id)` |
| rfm_analysis_user_id_contact_id_key | btree | user_id, contact_id | sim | sim |  | `CREATE UNIQUE INDEX rfm_analysis_user_id_contact_id_key ON public.rfm_analysis USING btree (user_id, contact_id)` |
| unique_rfm_analysis_company | btree | user_id, company_id | sim | sim |  | `CREATE UNIQUE INDEX unique_rfm_analysis_company ON public.rfm_analysis USING btree (user_id, company_id)` |


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

### `Users can manage their own RFM analysis`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(auth.uid() = user_id)` |
| WITH CHECK |  |

### `Users can update own`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |

### `Users can view own`

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
| set_updated_at_rfm_analysis | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
