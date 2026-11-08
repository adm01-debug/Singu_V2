# _dormant.disc_interaction_signals

> SINGU: Sinais de perfil DISC detectados em interações

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
| 4 | `interaction_id` | `uuid` | sim |  |  |  |
| 5 | `detected_profile` | `text` | não |  |  |  |
| 6 | `signal_strength` | `numeric(3,2)` | não |  |  |  |
| 7 | `signal_type` | `text` | não |  |  |  |
| 8 | `evidence` | `text` | sim |  |  |  |
| 9 | `context` | `text` | sim |  |  |  |
| 10 | `confidence` | `numeric(3,2)` | sim |  |  |  |
| 11 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| disc_interaction_signals_confidence_check | CHECK | `CHECK (confidence >= 0::numeric AND confidence <= 1::numeric)` |  |  | sim |
| disc_interaction_signals_contact_id_fkey | FOREIGN KEY | `FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| disc_interaction_signals_detected_profile_check | CHECK | `CHECK (detected_profile = ANY (ARRAY['D'::text, 'I'::text, 'S'::text, 'C'::text]))` |  |  | sim |
| disc_interaction_signals_interaction_id_fkey | FOREIGN KEY | `FOREIGN KEY (interaction_id) REFERENCES interactions(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| disc_interaction_signals_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| disc_interaction_signals_signal_strength_check | CHECK | `CHECK (signal_strength >= 0::numeric AND signal_strength <= 1::numeric)` |  |  | sim |
| disc_interaction_signals_signal_type_check | CHECK | `CHECK (signal_type = ANY (ARRAY['word_choice'::text, 'sentence_structure'::text, 'response_speed'::text, 'detail_level'::text, 'emotional_tone'::text, 'decision_style'::text, 'question_type'::text, 'objection_style'::text, 'negotiation_style'::text, 'other'::text]))` |  |  | sim |
| disc_interaction_signals_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| disc_interaction_signals_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX disc_interaction_signals_pkey ON _dormant.disc_interaction_signals USING btree (id)` |


## Policies (RLS)

### `dormant_deny_all_disc_interaction_signals`

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
