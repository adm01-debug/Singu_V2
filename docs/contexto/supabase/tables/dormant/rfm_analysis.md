# _dormant.rfm_analysis

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
| 3 | `contact_id` | `uuid` | não |  |  |  |
| 4 | `recency_score` | `integer` | não |  |  |  |
| 5 | `frequency_score` | `integer` | não |  |  |  |
| 6 | `monetary_score` | `integer` | não |  |  |  |
| 7 | `rfm_score` | `integer` | sim | `(((recency_score * 100) + (frequency_score * 10)) + monetary_score)` | s |  |
| 8 | `total_score` | `integer` | sim | `((recency_score + frequency_score) + monetary_score)` | s |  |
| 9 | `days_since_last_purchase` | `integer` | sim |  |  |  |
| 10 | `days_since_last_interaction` | `integer` | sim |  |  |  |
| 11 | `total_purchases` | `integer` | sim | `0` |  |  |
| 12 | `total_interactions` | `integer` | sim | `0` |  |  |
| 13 | `total_monetary_value` | `numeric(12,2)` | sim | `0` |  |  |
| 14 | `average_order_value` | `numeric(12,2)` | sim | `0` |  |  |
| 15 | `segment` | `text` | não |  |  |  |
| 16 | `segment_description` | `text` | sim |  |  |  |
| 17 | `segment_color` | `text` | sim |  |  |  |
| 18 | `recency_trend` | `text` | sim |  |  |  |
| 19 | `frequency_trend` | `text` | sim |  |  |  |
| 20 | `monetary_trend` | `text` | sim |  |  |  |
| 21 | `overall_trend` | `text` | sim |  |  |  |
| 22 | `predicted_next_purchase_date` | `date` | sim |  |  |  |
| 23 | `predicted_lifetime_value` | `numeric(12,2)` | sim |  |  |  |
| 24 | `churn_probability` | `numeric(5,2)` | sim |  |  |  |
| 25 | `recommended_actions` | `jsonb` | sim | `'[]'::jsonb` |  |  |
| 26 | `recommended_offers` | `jsonb` | sim | `'[]'::jsonb` |  |  |
| 27 | `communication_priority` | `text` | sim |  |  |  |
| 28 | `analyzed_at` | `timestamp with time zone` | não | `now()` |  |  |
| 29 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 30 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| rfm_analysis_communication_priority_check | CHECK | `CHECK (communication_priority = ANY (ARRAY['urgent'::text, 'high'::text, 'medium'::text, 'low'::text]))` |  |  | sim |
| rfm_analysis_contact_id_fkey | FOREIGN KEY | `FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| rfm_analysis_frequency_score_check | CHECK | `CHECK (frequency_score >= 1 AND frequency_score <= 5)` |  |  | sim |
| rfm_analysis_frequency_trend_check | CHECK | `CHECK (frequency_trend = ANY (ARRAY['improving'::text, 'stable'::text, 'declining'::text]))` |  |  | sim |
| rfm_analysis_monetary_score_check | CHECK | `CHECK (monetary_score >= 1 AND monetary_score <= 5)` |  |  | sim |
| rfm_analysis_monetary_trend_check | CHECK | `CHECK (monetary_trend = ANY (ARRAY['improving'::text, 'stable'::text, 'declining'::text]))` |  |  | sim |
| rfm_analysis_overall_trend_check | CHECK | `CHECK (overall_trend = ANY (ARRAY['improving'::text, 'stable'::text, 'declining'::text]))` |  |  | sim |
| rfm_analysis_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| rfm_analysis_recency_score_check | CHECK | `CHECK (recency_score >= 1 AND recency_score <= 5)` |  |  | sim |
| rfm_analysis_recency_trend_check | CHECK | `CHECK (recency_trend = ANY (ARRAY['improving'::text, 'stable'::text, 'declining'::text]))` |  |  | sim |
| rfm_analysis_user_id_contact_id_key | UNIQUE | `UNIQUE (user_id, contact_id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_rfm_analysis_contact | btree | contact_id | não | sim |  | `CREATE INDEX idx_rfm_analysis_contact ON _dormant.rfm_analysis USING btree (contact_id)` |
| rfm_analysis_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX rfm_analysis_pkey ON _dormant.rfm_analysis USING btree (id)` |
| rfm_analysis_user_id_contact_id_key | btree | user_id, contact_id | sim | sim |  | `CREATE UNIQUE INDEX rfm_analysis_user_id_contact_id_key ON _dormant.rfm_analysis USING btree (user_id, contact_id)` |


## Policies (RLS)

### `Users can manage their own RFM analysis`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | public |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| set_updated_at_rfm_analysis | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| anon | SELECT |
| authenticated | SELECT |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
