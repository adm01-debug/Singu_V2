# _dormant.emotional_anchors

> SINGU: Âncoras emocionais identificadas por contato

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
| 4 | `anchor_type` | `text` | não |  |  |  |
| 5 | `anchor_subject` | `text` | não |  |  |  |
| 6 | `associated_emotion` | `text` | sim |  |  |  |
| 7 | `emotion_intensity` | `numeric(3,2)` | sim |  |  |  |
| 8 | `discovery_context` | `text` | sim |  |  |  |
| 9 | `discovered_in_interaction_id` | `uuid` | sim |  |  |  |
| 10 | `usage_recommendation` | `text` | sim |  |  |  |
| 11 | `is_validated` | `boolean` | sim | `false` |  |  |
| 12 | `times_observed` | `integer` | sim | `1` |  |  |
| 13 | `is_active` | `boolean` | sim | `true` |  |  |
| 14 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 15 | `updated_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| emotional_anchors_anchor_type_check | CHECK | `CHECK (anchor_type = ANY (ARRAY['positive'::text, 'negative'::text, 'trigger'::text, 'comfort'::text, 'motivation'::text, 'fear'::text]))` |  |  | sim |
| emotional_anchors_contact_id_fkey | FOREIGN KEY | `FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| emotional_anchors_discovered_in_interaction_id_fkey | FOREIGN KEY | `FOREIGN KEY (discovered_in_interaction_id) REFERENCES interactions(id)` | NO ACTION | NO ACTION | sim |
| emotional_anchors_emotion_intensity_check | CHECK | `CHECK (emotion_intensity >= 0::numeric AND emotion_intensity <= 1::numeric)` |  |  | sim |
| emotional_anchors_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| emotional_anchors_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| emotional_anchors_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX emotional_anchors_pkey ON _dormant.emotional_anchors USING btree (id)` |


## Policies (RLS)

### `dormant_deny_all_emotional_anchors`

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

_nenhum_
