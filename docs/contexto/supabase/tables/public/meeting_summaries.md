# public.meeting_summaries

> SINGU: Resumos de reuniões gerados por IA. Edge Function meeting-summary extrai decisões, action items, participantes e next steps de transcript/audio/video.

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
| 3 | `contact_id` | `uuid` | sim |  |  |  |
| 4 | `company_id` | `uuid` | sim |  |  |  |
| 5 | `meeting_date` | `timestamp with time zone` | não |  |  |  |
| 6 | `duration_minutes` | `integer` | sim |  |  |  |
| 7 | `participants` | `jsonb` | sim | `'[]'::jsonb` |  |  |
| 8 | `summary` | `text` | não |  |  |  |
| 9 | `decisions` | `jsonb` | sim | `'[]'::jsonb` |  |  |
| 10 | `action_items` | `jsonb` | sim | `'[]'::jsonb` |  |  |
| 11 | `next_steps` | `jsonb` | sim | `'[]'::jsonb` |  |  |
| 12 | `questions_raised` | `jsonb` | sim | `'[]'::jsonb` |  |  |
| 13 | `objections` | `jsonb` | sim | `'[]'::jsonb` |  |  |
| 14 | `key_topics` | `text[]` | sim | `'{}'::text[]` |  |  |
| 15 | `sentiment` | `text` | sim |  |  |  |
| 16 | `transcript` | `text` | sim |  |  |  |
| 17 | `audio_url` | `text` | sim |  |  |  |
| 18 | `video_url` | `text` | sim |  |  |  |
| 19 | `source` | `text` | sim | `'manual'::text` |  |  |
| 20 | `interaction_id` | `uuid` | sim |  |  |  |
| 21 | `ai_model` | `text` | sim |  |  |  |
| 22 | `ai_confidence` | `integer` | sim |  |  |  |
| 23 | `metadata` | `jsonb` | sim | `'{}'::jsonb` |  |  |
| 24 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 25 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |
| 26 | `key_decisions` | `text[]` | sim | `'{}'::text[]` |  |  |
| 27 | `sentiment_overview` | `text` | sim |  |  |  |
| 28 | `topics` | `text[]` | sim | `'{}'::text[]` |  |  |
| 29 | `generated_by_model` | `text` | sim | `'gemini-2.5-flash'::text` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| meeting_summaries_ai_confidence_check | CHECK | `CHECK (ai_confidence >= 0 AND ai_confidence <= 100)` |  |  | sim |
| meeting_summaries_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| meeting_summaries_sentiment_check | CHECK | `CHECK (sentiment = ANY (ARRAY['very_positive'::text, 'positive'::text, 'neutral'::text, 'negative'::text, 'very_negative'::text, 'mixed'::text]))` |  |  | sim |
| meeting_summaries_source_check | CHECK | `CHECK (source = ANY (ARRAY['manual'::text, 'gmeet'::text, 'zoom'::text, 'teams'::text, 'recording'::text, 'whatsapp'::text, 'phone'::text]))` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_meeting_summaries_interaction | btree | interaction_id | sim | sim |  | `CREATE UNIQUE INDEX idx_meeting_summaries_interaction ON public.meeting_summaries USING btree (interaction_id)` |
| idx_meeting_summaries_user_id | btree | user_id | não | sim |  | `CREATE INDEX idx_meeting_summaries_user_id ON public.meeting_summaries USING btree (user_id)` |
| meeting_summaries_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX meeting_summaries_pkey ON public.meeting_summaries USING btree (id)` |


## Policies (RLS)

### `Users can create own meeting summaries`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |

### `Users can delete own`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `Users can delete own meeting summaries`

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

### `Users can update own`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |

### `Users can update own meeting summaries`

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

### `Users can view own meeting summaries`

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
| update_meeting_summaries_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
