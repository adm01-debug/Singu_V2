# public.disc_analysis_history

> SINGU: Histórico de análises DISC por contato. Cada registro = 1 análise (manual ou IA). FK contacts(id).

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
| usada por views | public.vw_pending_followups, public.vw_singu_contact_360, public.vw_singu_readiness, public.vw_singu_usage_kpis, zapp_history.v_contact_360 |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `user_id` | `uuid` | não |  |  |  |
| 3 | `contact_id` | `uuid` | não |  |  |  |
| 4 | `interaction_id` | `uuid` | sim |  |  |  |
| 5 | `primary_profile` | `text` | não |  |  |  |
| 6 | `secondary_profile` | `text` | sim |  |  |  |
| 7 | `blend_profile` | `text` | sim |  |  |  |
| 8 | `dominance_score` | `integer` | não | `0` |  |  |
| 9 | `influence_score` | `integer` | não | `0` |  |  |
| 10 | `steadiness_score` | `integer` | não | `0` |  |  |
| 11 | `conscientiousness_score` | `integer` | não | `0` |  |  |
| 12 | `confidence` | `integer` | não | `50` |  |  |
| 13 | `stress_primary` | `text` | sim |  |  |  |
| 14 | `stress_secondary` | `text` | sim |  |  |  |
| 15 | `analysis_source` | `text` | não | `'manual'::text` |  |  |
| 16 | `analyzed_text` | `text` | sim |  |  |  |
| 17 | `analysis_notes` | `text` | sim |  |  |  |
| 18 | `profile_summary` | `text` | sim |  |  |  |
| 19 | `detected_keywords` | `jsonb` | sim | `'[]'::jsonb` |  |  |
| 20 | `detected_phrases` | `jsonb` | sim | `'[]'::jsonb` |  |  |
| 21 | `behavior_indicators` | `jsonb` | sim | `'[]'::jsonb` |  |  |
| 22 | `analyzed_at` | `timestamp with time zone` | não | `now()` |  |  |
| 23 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| chk_disc_confidence | CHECK | `CHECK (confidence >= 0 AND confidence <= 100)` |  |  | sim |
| chk_disc_primary | CHECK | `CHECK (primary_profile = ANY (ARRAY['D'::text, 'I'::text, 'S'::text, 'C'::text]))` |  |  | sim |
| chk_disc_scores | CHECK | `CHECK (dominance_score >= 0 AND dominance_score <= 100 AND influence_score >= 0 AND influence_score <= 100 AND steadiness_score >= 0 AND steadiness_score <= 100 AND conscientiousness_score >= 0 AND conscientiousness_score <= 100)` |  |  | sim |
| chk_disc_source | CHECK | `CHECK (analysis_source = ANY (ARRAY['manual'::text, 'ai'::text, 'interaction'::text]))` |  |  | sim |
| disc_analysis_history_contact_id_fkey | FOREIGN KEY | `FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| disc_analysis_history_interaction_id_fkey | FOREIGN KEY | `FOREIGN KEY (interaction_id) REFERENCES interactions(id)` | NO ACTION | NO ACTION | sim |
| disc_analysis_history_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| disc_analysis_history_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX disc_analysis_history_pkey ON public.disc_analysis_history USING btree (id)` |
| idx_disc_analysis_history_analyzed_at | btree | analyzed_at | não | sim |  | `CREATE INDEX idx_disc_analysis_history_analyzed_at ON public.disc_analysis_history USING btree (analyzed_at DESC)` |
| idx_disc_analysis_history_contact | btree | contact_id | não | sim |  | `CREATE INDEX idx_disc_analysis_history_contact ON public.disc_analysis_history USING btree (contact_id)` |
| idx_disc_analysis_history_interaction_id | btree | interaction_id | não | sim |  | `CREATE INDEX idx_disc_analysis_history_interaction_id ON public.disc_analysis_history USING btree (interaction_id)` |
| idx_disc_analysis_history_user | btree | user_id | não | sim |  | `CREATE INDEX idx_disc_analysis_history_user ON public.disc_analysis_history USING btree (user_id)` |


## Policies (RLS)

### `Users can create their own DISC analysis`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(auth.uid() = user_id)` |

### `Users can delete own`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `Users can delete their own DISC analysis`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(auth.uid() = user_id)` |
| WITH CHECK |  |

### `Users can insert own`

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
| WITH CHECK |  |

### `Users can update their own disc_analysis_history`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(auth.uid() = user_id)` |
| WITH CHECK |  |

### `Users can view own`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `Users can view their own DISC analysis history`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(auth.uid() = user_id)` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| on_disc_analysis_change | AFTER | INSERT OR DELETE OR UPDATE | ROW | enabled | public.process_disc_analysis_audit |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
