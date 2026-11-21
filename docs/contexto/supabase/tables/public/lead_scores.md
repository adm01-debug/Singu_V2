# public.lead_scores

> SINGU: Score atual de lead por contato. 4 dimensões ponderadas (Engagement 30%, Fit 20%, Intent 25%, Relationship 25%). Grade automática. 1 registro por contato. Série temporal em lead_score_history.

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 8 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `user_id` | `uuid` | não |  |  |  |
| 3 | `contact_id` | `uuid` | não |  |  |  |
| 4 | `total_score` | `integer` | não | `0` |  |  |
| 5 | `engagement_score` | `integer` | não | `0` |  |  |
| 6 | `fit_score` | `integer` | não | `0` |  |  |
| 7 | `intent_score` | `integer` | não | `0` |  |  |
| 8 | `relationship_score` | `integer` | não | `0` |  |  |
| 9 | `grade` | `text` | não | `'cold'::text` |  |  |
| 10 | `factors` | `jsonb` | sim | `'{}'::jsonb` |  |  |
| 11 | `weights_snapshot` | `jsonb` | sim | `'{}'::jsonb` |  |  |
| 12 | `previous_score` | `integer` | sim |  |  |  |
| 13 | `score_change` | `integer` | sim | `(total_score - COALESCE(previous_score, 0))` | s |  |
| 14 | `trend` | `text` | sim |  |  |  |
| 15 | `calculated_at` | `timestamp with time zone` | não | `now()` |  |  |
| 16 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 17 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |
| 18 | `score_factors` | `jsonb` | não | `'[]'::jsonb` |  |  |
| 19 | `weight_engagement` | `numeric(3,2)` | não | `0.30` |  |  |
| 20 | `weight_fit` | `numeric(3,2)` | não | `0.20` |  |  |
| 21 | `weight_intent` | `numeric(3,2)` | não | `0.25` |  |  |
| 22 | `weight_relationship` | `numeric(3,2)` | não | `0.25` |  |  |
| 23 | `last_calculated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| lead_scores_contact_id_fkey | FOREIGN KEY | `FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| lead_scores_engagement_score_check | CHECK | `CHECK (engagement_score >= 0 AND engagement_score <= 100)` |  |  | sim |
| lead_scores_fit_score_check | CHECK | `CHECK (fit_score >= 0 AND fit_score <= 100)` |  |  | sim |
| lead_scores_grade_check | CHECK | `CHECK (grade = ANY (ARRAY['cold'::text, 'warm'::text, 'hot'::text, 'on_fire'::text]))` |  |  | sim |
| lead_scores_intent_score_check | CHECK | `CHECK (intent_score >= 0 AND intent_score <= 100)` |  |  | sim |
| lead_scores_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| lead_scores_relationship_score_check | CHECK | `CHECK (relationship_score >= 0 AND relationship_score <= 100)` |  |  | sim |
| lead_scores_total_score_check | CHECK | `CHECK (total_score >= 0 AND total_score <= 100)` |  |  | sim |
| lead_scores_trend_check | CHECK | `CHECK (trend = ANY (ARRAY['rising'::text, 'falling'::text, 'stable'::text, 'new'::text]))` |  |  | sim |
| unique_lead_score_contact | UNIQUE | `UNIQUE (user_id, contact_id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| lead_scores_contact_id_user_id_key | btree | contact_id, user_id | sim | sim |  | `CREATE UNIQUE INDEX lead_scores_contact_id_user_id_key ON public.lead_scores USING btree (contact_id, user_id)` |
| lead_scores_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX lead_scores_pkey ON public.lead_scores USING btree (id)` |
| unique_lead_score_contact | btree | user_id, contact_id | sim | sim |  | `CREATE UNIQUE INDEX unique_lead_score_contact ON public.lead_scores USING btree (user_id, contact_id)` |


## Policies (RLS)

### `Users can delete own`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `Users can delete their own lead scores`

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

### `Users can insert their own lead scores`

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

### `Users can update their own lead scores`

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

### `Users can view their own lead scores`

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
| tg_lead_scores_audit | AFTER | INSERT OR DELETE OR UPDATE | ROW | enabled | public.audit_trigger_fn |
| tg_lead_scores_updated | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |
| update_lead_scores_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
