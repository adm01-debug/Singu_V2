# public.vak_analysis_history

> SINGU: Histórico de análises VAK (Visual/Auditivo/Cinestésico/Digital) por contato. Cada registro = 1 análise (manual, AI automática via keyword_match em vak_keywords, ou voice_analysis). Espelha o padrão de disc_analysis_history e eq_analysis_history.

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
| 4 | `interaction_id` | `uuid` | sim |  |  |  |
| 5 | `primary_modality` | `character varying(1)` | não |  |  |  |
| 6 | `secondary_modality` | `character varying(1)` | sim |  |  |  |
| 7 | `visual_score` | `integer` | não | `0` |  |  |
| 8 | `auditory_score` | `integer` | não | `0` |  |  |
| 9 | `kinesthetic_score` | `integer` | não | `0` |  |  |
| 10 | `digital_score` | `integer` | sim | `0` |  |  |
| 11 | `confidence` | `integer` | não | `50` |  |  |
| 12 | `analysis_source` | `text` | não | `'manual'::text` |  |  |
| 13 | `analyzed_text` | `text` | sim |  |  |  |
| 14 | `detected_keywords` | `jsonb` | sim | `'[]'::jsonb` |  |  |
| 15 | `detected_phrases` | `jsonb` | sim | `'[]'::jsonb` |  |  |
| 16 | `sensory_indicators` | `jsonb` | sim | `'[]'::jsonb` |  |  |
| 17 | `recommended_approach` | `text` | sim |  |  |  |
| 18 | `communication_tips` | `jsonb` | sim | `'[]'::jsonb` |  |  |
| 19 | `profile_summary` | `text` | sim |  |  |  |
| 20 | `analysis_notes` | `text` | sim |  |  |  |
| 21 | `analyzed_at` | `timestamp with time zone` | não | `now()` |  |  |
| 22 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 23 | `visual_words` | `text[]` | sim | `'{}'::text[]` |  |  |
| 24 | `auditory_words` | `text[]` | sim | `'{}'::text[]` |  |  |
| 25 | `kinesthetic_words` | `text[]` | sim | `'{}'::text[]` |  |  |
| 26 | `digital_words` | `text[]` | sim | `'{}'::text[]` |  |  |
| 27 | `is_validated` | `boolean` | sim | `false` |  |  |
| 28 | `user_feedback` | `text` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| vak_analysis_history_analysis_source_check | CHECK | `CHECK (analysis_source = ANY (ARRAY['manual'::text, 'ai_auto'::text, 'keyword_match'::text, 'voice_analysis'::text, 'hybrid'::text]))` |  |  | sim |
| vak_analysis_history_auditory_score_check | CHECK | `CHECK (auditory_score >= 0 AND auditory_score <= 100)` |  |  | sim |
| vak_analysis_history_confidence_check | CHECK | `CHECK (confidence >= 0 AND confidence <= 100)` |  |  | sim |
| vak_analysis_history_contact_id_fkey | FOREIGN KEY | `FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| vak_analysis_history_digital_score_check | CHECK | `CHECK (digital_score >= 0 AND digital_score <= 100)` |  |  | sim |
| vak_analysis_history_interaction_id_fkey | FOREIGN KEY | `FOREIGN KEY (interaction_id) REFERENCES interactions(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| vak_analysis_history_kinesthetic_score_check | CHECK | `CHECK (kinesthetic_score >= 0 AND kinesthetic_score <= 100)` |  |  | sim |
| vak_analysis_history_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| vak_analysis_history_primary_modality_check | CHECK | `CHECK (primary_modality::text = ANY (ARRAY['V'::character varying, 'A'::character varying, 'K'::character varying, 'D'::character varying]::text[]))` |  |  | sim |
| vak_analysis_history_secondary_modality_check | CHECK | `CHECK (secondary_modality::text = ANY (ARRAY['V'::character varying, 'A'::character varying, 'K'::character varying, 'D'::character varying]::text[]))` |  |  | sim |
| vak_analysis_history_visual_score_check | CHECK | `CHECK (visual_score >= 0 AND visual_score <= 100)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_vak_analysis_contact | btree | contact_id | não | sim |  | `CREATE INDEX idx_vak_analysis_contact ON public.vak_analysis_history USING btree (contact_id)` |
| idx_vak_analysis_history_user_id | btree | user_id | não | sim |  | `CREATE INDEX idx_vak_analysis_history_user_id ON public.vak_analysis_history USING btree (user_id)` |
| idx_vak_analysis_user | btree | user_id | não | sim |  | `CREATE INDEX idx_vak_analysis_user ON public.vak_analysis_history USING btree (user_id)` |
| idx_vak_kinesthetic_score | btree | kinesthetic_score | não | sim |  | `CREATE INDEX idx_vak_kinesthetic_score ON public.vak_analysis_history USING btree (kinesthetic_score)` |
| idx_vak_visual_score | btree | visual_score | não | sim |  | `CREATE INDEX idx_vak_visual_score ON public.vak_analysis_history USING btree (visual_score)` |
| vak_analysis_history_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX vak_analysis_history_pkey ON public.vak_analysis_history USING btree (id)` |


## Policies (RLS)

### `Users can delete own`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `Users can delete their own VAK analysis`

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

### `Users can insert their own VAK analysis`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(auth.uid() = user_id)` |

### `Users can update own`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |

### `Users can update their own vak_analysis_history`

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

### `Users can view their own VAK analysis`

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
| tr_sync_vak_to_contact | AFTER | INSERT OR UPDATE | ROW | enabled | public.sync_nlp_to_contact |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
