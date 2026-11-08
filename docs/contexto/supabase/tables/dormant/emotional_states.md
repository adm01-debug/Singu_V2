# _dormant.emotional_states

> SINGU: Estados emocionais detectados em interações

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
| 4 | `interaction_id` | `uuid` | sim |  |  |  |
| 5 | `detection_source` | `text` | não |  |  |  |
| 6 | `primary_emotion` | `text` | não |  |  |  |
| 7 | `primary_emotion_score` | `numeric(3,2)` | sim |  |  |  |
| 8 | `secondary_emotion` | `text` | sim |  |  |  |
| 9 | `secondary_emotion_score` | `numeric(3,2)` | sim |  |  |  |
| 10 | `valence` | `numeric(4,3)` | sim |  |  |  |
| 11 | `arousal` | `numeric(3,2)` | sim |  |  |  |
| 12 | `all_emotions` | `jsonb` | sim | `'{}'::jsonb` |  |  |
| 13 | `context` | `text` | sim |  |  |  |
| 14 | `trigger_event` | `text` | sim |  |  |  |
| 15 | `detected_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 16 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| emotional_states_arousal_check | CHECK | `CHECK (arousal >= 0::numeric AND arousal <= 1::numeric)` |  |  | sim |
| emotional_states_contact_id_fkey | FOREIGN KEY | `FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| emotional_states_detection_source_check | CHECK | `CHECK (detection_source = ANY (ARRAY['text_analysis'::text, 'voice_analysis'::text, 'facial_analysis'::text, 'manual'::text, 'combined'::text]))` |  |  | sim |
| emotional_states_interaction_id_fkey | FOREIGN KEY | `FOREIGN KEY (interaction_id) REFERENCES interactions(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| emotional_states_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| emotional_states_primary_emotion_check | CHECK | `CHECK (primary_emotion = ANY (ARRAY['joy'::text, 'trust'::text, 'fear'::text, 'surprise'::text, 'sadness'::text, 'disgust'::text, 'anger'::text, 'anticipation'::text, 'interest'::text, 'confusion'::text, 'frustration'::text, 'excitement'::text, 'anxiety'::text, 'confidence'::text, 'doubt'::text, 'neutral'::text]))` |  |  | sim |
| emotional_states_primary_emotion_score_check | CHECK | `CHECK (primary_emotion_score >= 0::numeric AND primary_emotion_score <= 1::numeric)` |  |  | sim |
| emotional_states_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| emotional_states_valence_check | CHECK | `CHECK (valence >= '-1'::integer::numeric AND valence <= 1::numeric)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| emotional_states_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX emotional_states_pkey ON _dormant.emotional_states USING btree (id)` |


## Policies (RLS)

### `dormant_deny_all_emotional_states`

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
