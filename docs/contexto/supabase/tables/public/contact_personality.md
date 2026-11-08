# public.contact_personality

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 3 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `contact_id` | `uuid` | não |  |  |  |
| 3 | `big_five_openness` | `integer` | sim |  |  |  |
| 4 | `big_five_conscientiousness` | `integer` | sim |  |  |  |
| 5 | `big_five_extraversion` | `integer` | sim |  |  |  |
| 6 | `big_five_agreeableness` | `integer` | sim |  |  |  |
| 7 | `big_five_neuroticism` | `integer` | sim |  |  |  |
| 8 | `big_five_confidence` | `integer` | sim |  |  |  |
| 9 | `mbti_type` | `text` | sim |  |  |  |
| 10 | `mbti_e_i_score` | `integer` | sim |  |  |  |
| 11 | `mbti_s_n_score` | `integer` | sim |  |  |  |
| 12 | `mbti_t_f_score` | `integer` | sim |  |  |  |
| 13 | `mbti_j_p_score` | `integer` | sim |  |  |  |
| 14 | `enneagram_type` | `integer` | sim |  |  |  |
| 15 | `enneagram_wing` | `integer` | sim |  |  |  |
| 16 | `enneagram_scores` | `jsonb` | sim |  |  |  |
| 17 | `temperament_primary` | `text` | sim |  |  |  |
| 18 | `temperament_secondary` | `text` | sim |  |  |  |
| 19 | `temperament_notes` | `text` | sim |  |  |  |
| 20 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 21 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| contact_personality_big_five_agreeableness_check | CHECK | `CHECK (big_five_agreeableness >= 0 AND big_five_agreeableness <= 100)` |  |  | sim |
| contact_personality_big_five_confidence_check | CHECK | `CHECK (big_five_confidence >= 0 AND big_five_confidence <= 100)` |  |  | sim |
| contact_personality_big_five_conscientiousness_check | CHECK | `CHECK (big_five_conscientiousness >= 0 AND big_five_conscientiousness <= 100)` |  |  | sim |
| contact_personality_big_five_extraversion_check | CHECK | `CHECK (big_five_extraversion >= 0 AND big_five_extraversion <= 100)` |  |  | sim |
| contact_personality_big_five_neuroticism_check | CHECK | `CHECK (big_five_neuroticism >= 0 AND big_five_neuroticism <= 100)` |  |  | sim |
| contact_personality_big_five_openness_check | CHECK | `CHECK (big_five_openness >= 0 AND big_five_openness <= 100)` |  |  | sim |
| contact_personality_contact_id_fkey | FOREIGN KEY | `FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| contact_personality_contact_id_key | UNIQUE | `UNIQUE (contact_id)` |  |  | sim |
| contact_personality_enneagram_type_check | CHECK | `CHECK (enneagram_type >= 1 AND enneagram_type <= 9)` |  |  | sim |
| contact_personality_enneagram_wing_check | CHECK | `CHECK (enneagram_wing >= 1 AND enneagram_wing <= 9)` |  |  | sim |
| contact_personality_mbti_e_i_score_check | CHECK | `CHECK (mbti_e_i_score >= 0 AND mbti_e_i_score <= 100)` |  |  | sim |
| contact_personality_mbti_j_p_score_check | CHECK | `CHECK (mbti_j_p_score >= 0 AND mbti_j_p_score <= 100)` |  |  | sim |
| contact_personality_mbti_s_n_score_check | CHECK | `CHECK (mbti_s_n_score >= 0 AND mbti_s_n_score <= 100)` |  |  | sim |
| contact_personality_mbti_t_f_score_check | CHECK | `CHECK (mbti_t_f_score >= 0 AND mbti_t_f_score <= 100)` |  |  | sim |
| contact_personality_mbti_type_check | CHECK | `CHECK (mbti_type ~ '^[E\|I][S\|N][T\|F][J\|P]$'::text)` |  |  | sim |
| contact_personality_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| contact_personality_contact_id_key | btree | contact_id | sim | sim |  | `CREATE UNIQUE INDEX contact_personality_contact_id_key ON public.contact_personality USING btree (contact_id)` |
| contact_personality_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX contact_personality_pkey ON public.contact_personality USING btree (id)` |


## Policies (RLS)

### `Owner or admin can delete contact_personality`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `((EXISTS ( SELECT 1    FROM contacts c   WHERE ((c.id = contact_personality.contact_id) AND (c.user_id = ( SELECT auth.uid() AS uid))))) OR has_role(( SELECT auth.uid() AS uid), 'admin'::app_role))` |
| WITH CHECK |  |

### `Owner or admin can insert contact_personality`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `((EXISTS ( SELECT 1    FROM contacts c   WHERE ((c.id = contact_personality.contact_id) AND (c.user_id = ( SELECT auth.uid() AS uid))))) OR has_role(( SELECT auth.uid() AS uid), 'admin'::app_role))` |

### `Owner or admin can update contact_personality`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `((EXISTS ( SELECT 1    FROM contacts c   WHERE ((c.id = contact_personality.contact_id) AND (c.user_id = ( SELECT auth.uid() AS uid))))) OR has_role(( SELECT auth.uid() AS uid), 'admin'::app_role))` |
| WITH CHECK | `((EXISTS ( SELECT 1    FROM contacts c   WHERE ((c.id = contact_personality.contact_id) AND (c.user_id = ( SELECT auth.uid() AS uid))))) OR has_role(( SELECT auth.uid() AS uid), 'admin'::app_role))` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| log_contact_personality_change | AFTER | UPDATE | ROW | enabled | public.log_behavioral_change |
| tr_check_mbti_consistency | BEFORE | INSERT OR UPDATE | ROW | enabled | public.check_mbti_consistency |
| update_contact_personality_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

_nenhum_
