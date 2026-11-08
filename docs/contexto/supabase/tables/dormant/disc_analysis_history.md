# _dormant.disc_analysis_history

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
| 3 | `contact_id` | `uuid` | não |  |  |  |
| 4 | `interaction_id` | `uuid` | sim |  |  |  |
| 5 | `dominance_score` | `integer` | não | `0` |  |  |
| 6 | `influence_score` | `integer` | não | `0` |  |  |
| 7 | `steadiness_score` | `integer` | não | `0` |  |  |
| 8 | `conscientiousness_score` | `integer` | não | `0` |  |  |
| 9 | `primary_profile` | `text` | não |  |  |  |
| 10 | `secondary_profile` | `text` | sim |  |  |  |
| 11 | `blend_profile` | `text` | sim |  |  |  |
| 12 | `stress_primary` | `text` | sim |  |  |  |
| 13 | `stress_secondary` | `text` | sim |  |  |  |
| 14 | `confidence` | `integer` | não | `50` |  |  |
| 15 | `analysis_source` | `text` | não | `'manual'::text` |  |  |
| 16 | `detected_keywords` | `jsonb` | sim | `'[]'::jsonb` |  |  |
| 17 | `detected_phrases` | `jsonb` | sim | `'[]'::jsonb` |  |  |
| 18 | `behavior_indicators` | `jsonb` | sim | `'[]'::jsonb` |  |  |
| 19 | `analyzed_text` | `text` | sim |  |  |  |
| 20 | `analysis_notes` | `text` | sim |  |  |  |
| 21 | `profile_summary` | `text` | sim |  |  |  |
| 22 | `analyzed_at` | `timestamp with time zone` | não | `now()` |  |  |
| 23 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| disc_analysis_history_analysis_source_check | CHECK | `CHECK (analysis_source = ANY (ARRAY['manual'::text, 'ai_analysis'::text, 'questionnaire'::text, 'behavior_tracking'::text]))` |  |  | sim |
| disc_analysis_history_confidence_check | CHECK | `CHECK (confidence >= 0 AND confidence <= 100)` |  |  | sim |
| disc_analysis_history_conscientiousness_score_check | CHECK | `CHECK (conscientiousness_score >= 0 AND conscientiousness_score <= 100)` |  |  | sim |
| disc_analysis_history_contact_id_fkey | FOREIGN KEY | `FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| disc_analysis_history_dominance_score_check | CHECK | `CHECK (dominance_score >= 0 AND dominance_score <= 100)` |  |  | sim |
| disc_analysis_history_influence_score_check | CHECK | `CHECK (influence_score >= 0 AND influence_score <= 100)` |  |  | sim |
| disc_analysis_history_interaction_id_fkey | FOREIGN KEY | `FOREIGN KEY (interaction_id) REFERENCES interactions(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| disc_analysis_history_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| disc_analysis_history_primary_profile_check | CHECK | `CHECK (primary_profile = ANY (ARRAY['D'::text, 'I'::text, 'S'::text, 'C'::text]))` |  |  | sim |
| disc_analysis_history_secondary_profile_check | CHECK | `CHECK (secondary_profile = ANY (ARRAY['D'::text, 'I'::text, 'S'::text, 'C'::text]))` |  |  | sim |
| disc_analysis_history_steadiness_score_check | CHECK | `CHECK (steadiness_score >= 0 AND steadiness_score <= 100)` |  |  | sim |
| disc_analysis_history_stress_primary_check | CHECK | `CHECK (stress_primary = ANY (ARRAY['D'::text, 'I'::text, 'S'::text, 'C'::text]))` |  |  | sim |
| disc_analysis_history_stress_secondary_check | CHECK | `CHECK (stress_secondary = ANY (ARRAY['D'::text, 'I'::text, 'S'::text, 'C'::text]))` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| disc_analysis_history_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX disc_analysis_history_pkey ON _dormant.disc_analysis_history USING btree (id)` |
| idx_disc_analysis_history_contact | btree | contact_id | não | sim |  | `CREATE INDEX idx_disc_analysis_history_contact ON _dormant.disc_analysis_history USING btree (contact_id)` |


## Policies (RLS)

### `Users can create their own DISC analysis`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | public |
| USING |  |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |

### `Users can delete their own DISC analysis`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | public |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `Users can update their own disc_analysis_history`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `Users can view their own DISC analysis history`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | public |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| anon | SELECT |
| authenticated | SELECT |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
