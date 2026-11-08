# _dormant.contact_rfm_scores

> SINGU: Scores RFM calculados para cada contato

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
| 2 | `user_id` | `uuid` | sim |  |  |  |
| 3 | `contact_id` | `uuid` | não |  |  |  |
| 4 | `last_interaction_date` | `timestamp with time zone` | sim |  |  |  |
| 5 | `interaction_count` | `integer` | sim | `0` |  |  |
| 6 | `total_value` | `numeric(15,2)` | sim | `0` |  |  |
| 7 | `recency_score` | `integer` | sim |  |  |  |
| 8 | `frequency_score` | `integer` | sim |  |  |  |
| 9 | `monetary_score` | `integer` | sim |  |  |  |
| 10 | `combined_score` | `numeric(3,1)` | sim |  |  |  |
| 11 | `segment_id` | `uuid` | sim |  |  |  |
| 12 | `segment_code` | `text` | sim |  |  |  |
| 13 | `recency_trend` | `text` | sim |  |  |  |
| 14 | `frequency_trend` | `text` | sim |  |  |  |
| 15 | `monetary_trend` | `text` | sim |  |  |  |
| 16 | `overall_trend` | `text` | sim |  |  |  |
| 17 | `analysis_period_start` | `date` | sim |  |  |  |
| 18 | `analysis_period_end` | `date` | sim |  |  |  |
| 19 | `calculated_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 20 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 21 | `updated_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| contact_rfm_scores_combined_score_check | CHECK | `CHECK (combined_score >= 1::numeric AND combined_score <= 5::numeric)` |  |  | sim |
| contact_rfm_scores_contact_id_fkey | FOREIGN KEY | `FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| contact_rfm_scores_frequency_score_check | CHECK | `CHECK (frequency_score >= 1 AND frequency_score <= 5)` |  |  | sim |
| contact_rfm_scores_frequency_trend_check | CHECK | `CHECK (frequency_trend = ANY (ARRAY['up'::text, 'stable'::text, 'down'::text]))` |  |  | sim |
| contact_rfm_scores_monetary_score_check | CHECK | `CHECK (monetary_score >= 1 AND monetary_score <= 5)` |  |  | sim |
| contact_rfm_scores_monetary_trend_check | CHECK | `CHECK (monetary_trend = ANY (ARRAY['up'::text, 'stable'::text, 'down'::text]))` |  |  | sim |
| contact_rfm_scores_overall_trend_check | CHECK | `CHECK (overall_trend = ANY (ARRAY['improving'::text, 'stable'::text, 'declining'::text]))` |  |  | sim |
| contact_rfm_scores_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| contact_rfm_scores_recency_score_check | CHECK | `CHECK (recency_score >= 1 AND recency_score <= 5)` |  |  | sim |
| contact_rfm_scores_recency_trend_check | CHECK | `CHECK (recency_trend = ANY (ARRAY['up'::text, 'stable'::text, 'down'::text]))` |  |  | sim |
| contact_rfm_scores_segment_id_fkey | FOREIGN KEY | `FOREIGN KEY (segment_id) REFERENCES rfm_segment_config(id)` | NO ACTION | NO ACTION | sim |
| contact_rfm_scores_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| contact_rfm_scores_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX contact_rfm_scores_pkey ON _dormant.contact_rfm_scores USING btree (id)` |
| idx_rfm_scores_contact_unique | btree | contact_id | sim | sim |  | `CREATE UNIQUE INDEX idx_rfm_scores_contact_unique ON _dormant.contact_rfm_scores USING btree (contact_id)` |


## Policies (RLS)

### `dormant_deny_all_contact_rfm_scores`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | RESTRICTIVE |
| roles | public |
| USING | `false` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| anon | SELECT |
| authenticated | SELECT |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
