# public.disc_assessments

> SINGU: Avaliações DISC realizadas para contatos

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 2 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |
| usada por views | public.vw_closing_score_ranking, public.vw_communication_dashboard, public.vw_disc_compatibility, public.vw_eq_dashboard |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `user_id` | `uuid` | sim |  |  |  |
| 3 | `contact_id` | `uuid` | não |  |  |  |
| 4 | `d_score` | `integer` | não |  |  |  |
| 5 | `i_score` | `integer` | não |  |  |  |
| 6 | `s_score` | `integer` | não |  |  |  |
| 7 | `c_score` | `integer` | não |  |  |  |
| 8 | `primary_profile` | `text` | não |  |  |  |
| 9 | `secondary_profile` | `text` | sim |  |  |  |
| 10 | `combined_profile` | `text` | sim |  |  |  |
| 11 | `confidence` | `numeric(3,2)` | não |  |  |  |
| 12 | `assessment_method` | `text` | não |  |  |  |
| 13 | `raw_data` | `jsonb` | sim | `'{}'::jsonb` |  |  |
| 14 | `interactions_analyzed` | `integer` | sim | `0` |  |  |
| 15 | `notes` | `text` | sim |  |  |  |
| 16 | `is_current` | `boolean` | sim | `true` |  |  |
| 17 | `validated_by` | `uuid` | sim |  |  |  |
| 18 | `validated_at` | `timestamp with time zone` | sim |  |  |  |
| 19 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 20 | `updated_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| disc_assessments_assessment_method_check | CHECK | `CHECK (assessment_method = ANY (ARRAY['questionnaire'::text, 'ai_analysis'::text, 'manual'::text, 'imported'::text, 'hybrid'::text]))` |  |  | sim |
| disc_assessments_c_score_check | CHECK | `CHECK (c_score >= 0 AND c_score <= 100)` |  |  | sim |
| disc_assessments_confidence_check | CHECK | `CHECK (confidence >= 0::numeric AND confidence <= 1::numeric)` |  |  | sim |
| disc_assessments_contact_id_fkey | FOREIGN KEY | `FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| disc_assessments_d_score_check | CHECK | `CHECK (d_score >= 0 AND d_score <= 100)` |  |  | sim |
| disc_assessments_i_score_check | CHECK | `CHECK (i_score >= 0 AND i_score <= 100)` |  |  | sim |
| disc_assessments_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| disc_assessments_primary_profile_check | CHECK | `CHECK (primary_profile = ANY (ARRAY['D'::text, 'I'::text, 'S'::text, 'C'::text]))` |  |  | sim |
| disc_assessments_s_score_check | CHECK | `CHECK (s_score >= 0 AND s_score <= 100)` |  |  | sim |
| disc_assessments_secondary_profile_check | CHECK | `CHECK (secondary_profile = ANY (ARRAY['D'::text, 'I'::text, 'S'::text, 'C'::text]))` |  |  | sim |
| disc_assessments_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| disc_assessments_validated_by_fkey | FOREIGN KEY | `FOREIGN KEY (validated_by) REFERENCES profiles(id)` | NO ACTION | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| disc_assessments_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX disc_assessments_pkey ON public.disc_assessments USING btree (id)` |


## Policies (RLS)

### `disc_assessments_owner_access`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(contact_id IN ( SELECT c.id    FROM contacts c   WHERE (c.user_id = ( SELECT auth.uid() AS uid))))` |
| WITH CHECK | `(contact_id IN ( SELECT c.id    FROM contacts c   WHERE (c.user_id = ( SELECT auth.uid() AS uid))))` |

### `service_role_full_disc_assessments`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | service_role |
| USING | `true` |
| WITH CHECK | `true` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| set_owner_from_contact | BEFORE | INSERT OR UPDATE | ROW | enabled | public.set_owner_from_contact |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
