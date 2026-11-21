# public.trigger_intensity_history

> SINGU: Histórico temporal de intensidade dos gatilhos mentais aplicados por contato. Trackeia escalação progressiva (1-5) para analytics de quais níveis converteram. Append-only. is_escalation e reached_max_intensity são computed.

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
| 3 | `contact_id` | `uuid` | não |  |  |  |
| 4 | `trigger_type_id` | `uuid` | sim |  |  |  |
| 5 | `trigger_bundle_id` | `uuid` | sim |  |  |  |
| 6 | `intensity_level` | `integer` | não |  |  |  |
| 7 | `previous_intensity` | `integer` | sim |  |  |  |
| 8 | `intensity_change` | `integer` | sim | `(intensity_level - COALESCE(previous_intensity, intensity_level))` | s |  |
| 9 | `channel` | `text` | não |  |  |  |
| 10 | `applied_at` | `timestamp with time zone` | não | `now()` |  |  |
| 11 | `response_received` | `boolean` | sim | `false` |  |  |
| 12 | `response_sentiment` | `text` | sim |  |  |  |
| 13 | `conversion` | `boolean` | sim | `false` |  |  |
| 14 | `effectiveness_score` | `numeric(5,2)` | sim |  |  |  |
| 15 | `is_escalation` | `boolean` | sim | `(COALESCE(previous_intensity, 0) < intensity_level)` | s |  |
| 16 | `reached_max_intensity` | `boolean` | sim | `(intensity_level = 5)` | s |  |
| 17 | `notes` | `text` | sim |  |  |  |
| 18 | `metadata` | `jsonb` | sim | `'{}'::jsonb` |  |  |
| 19 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 20 | `trigger_type` | `text` | sim |  |  |  |
| 21 | `result` | `text` | sim |  |  |  |
| 22 | `interaction_id` | `uuid` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| trigger_intensity_history_contact_id_fkey | FOREIGN KEY | `FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| trigger_intensity_history_intensity_level_check | CHECK | `CHECK (intensity_level >= 1 AND intensity_level <= 5)` |  |  | sim |
| trigger_intensity_history_interaction_id_fkey | FOREIGN KEY | `FOREIGN KEY (interaction_id) REFERENCES interactions(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| trigger_intensity_history_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| trigger_intensity_history_previous_intensity_check | CHECK | `CHECK (previous_intensity >= 1 AND previous_intensity <= 5)` |  |  | sim |
| trigger_intensity_history_response_sentiment_check | CHECK | `CHECK (response_sentiment = ANY (ARRAY['positive'::text, 'neutral'::text, 'negative'::text, 'hostile'::text]))` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_trigger_intensity_history_trigger | btree | trigger_type | não | sim |  | `CREATE INDEX idx_trigger_intensity_history_trigger ON public.trigger_intensity_history USING btree (trigger_type)` |
| idx_trigger_intensity_history_user_contact | btree | user_id, contact_id | não | sim |  | `CREATE INDEX idx_trigger_intensity_history_user_contact ON public.trigger_intensity_history USING btree (user_id, contact_id)` |
| idx_trigger_intensity_history_user_id | btree | user_id | não | sim |  | `CREATE INDEX idx_trigger_intensity_history_user_id ON public.trigger_intensity_history USING btree (user_id)` |
| trigger_intensity_history_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX trigger_intensity_history_pkey ON public.trigger_intensity_history USING btree (id)` |


## Policies (RLS)

### `Users can create their own intensity history`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(auth.uid() = user_id)` |

### `Users can delete their own intensity history`

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

### `Users can update their own intensity history`

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

### `Users can view their own intensity history`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(auth.uid() = user_id)` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
