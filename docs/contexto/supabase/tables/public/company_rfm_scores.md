# public.company_rfm_scores

> SINGU: Scores RFM agregados por empresa

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
| 3 | `company_id` | `uuid` | não |  |  |  |
| 4 | `last_interaction_date` | `timestamp with time zone` | sim |  |  |  |
| 5 | `interaction_count` | `integer` | sim | `0` |  |  |
| 6 | `total_value` | `numeric(15,2)` | sim | `0` |  |  |
| 7 | `recency_score` | `integer` | sim |  |  |  |
| 8 | `frequency_score` | `integer` | sim |  |  |  |
| 9 | `monetary_score` | `integer` | sim |  |  |  |
| 10 | `combined_score` | `numeric(3,1)` | sim |  |  |  |
| 11 | `segment_id` | `uuid` | sim |  |  |  |
| 12 | `segment_code` | `text` | sim |  |  |  |
| 13 | `overall_trend` | `text` | sim |  |  |  |
| 14 | `contacts_count` | `integer` | sim | `0` |  |  |
| 15 | `avg_contact_score` | `numeric(3,1)` | sim |  |  |  |
| 16 | `calculated_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 17 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 18 | `updated_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| company_rfm_scores_combined_score_check | CHECK | `CHECK (combined_score >= 1::numeric AND combined_score <= 5::numeric)` |  |  | sim |
| company_rfm_scores_company_id_fkey | FOREIGN KEY | `FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| company_rfm_scores_frequency_score_check | CHECK | `CHECK (frequency_score >= 1 AND frequency_score <= 5)` |  |  | sim |
| company_rfm_scores_monetary_score_check | CHECK | `CHECK (monetary_score >= 1 AND monetary_score <= 5)` |  |  | sim |
| company_rfm_scores_overall_trend_check | CHECK | `CHECK (overall_trend = ANY (ARRAY['improving'::text, 'stable'::text, 'declining'::text]))` |  |  | sim |
| company_rfm_scores_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| company_rfm_scores_recency_score_check | CHECK | `CHECK (recency_score >= 1 AND recency_score <= 5)` |  |  | sim |
| company_rfm_scores_segment_id_fkey | FOREIGN KEY | `FOREIGN KEY (segment_id) REFERENCES rfm_segment_config(id)` | NO ACTION | NO ACTION | sim |
| company_rfm_scores_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| company_rfm_scores_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX company_rfm_scores_pkey ON public.company_rfm_scores USING btree (id)` |
| idx_company_rfm_scores_created_at | btree | created_at | não | sim |  | `CREATE INDEX idx_company_rfm_scores_created_at ON public.company_rfm_scores USING btree (created_at)` |
| idx_company_rfm_scores_segment_id | btree | segment_id | não | sim |  | `CREATE INDEX idx_company_rfm_scores_segment_id ON public.company_rfm_scores USING btree (segment_id)` |
| idx_company_rfm_segment | btree | segment_code | não | sim |  | `CREATE INDEX idx_company_rfm_segment ON public.company_rfm_scores USING btree (segment_code)` |
| idx_company_rfm_unique | btree | company_id | sim | sim |  | `CREATE UNIQUE INDEX idx_company_rfm_unique ON public.company_rfm_scores USING btree (company_id)` |
| idx_company_rfm_user | btree | user_id | não | sim |  | `CREATE INDEX idx_company_rfm_user ON public.company_rfm_scores USING btree (user_id)` |


## Policies (RLS)

### `company_rfm_scores_delete`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(user_id = ( SELECT auth.uid() AS uid))` |
| WITH CHECK |  |

### `company_rfm_scores_insert`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(user_id = ( SELECT auth.uid() AS uid))` |

### `company_rfm_scores_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(user_id = ( SELECT auth.uid() AS uid))` |
| WITH CHECK |  |

### `company_rfm_scores_update`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(user_id = ( SELECT auth.uid() AS uid))` |
| WITH CHECK | `(user_id = ( SELECT auth.uid() AS uid))` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| set_updated_at | BEFORE | UPDATE | ROW | enabled | public.set_updated_at |


## Grants

_nenhum_
