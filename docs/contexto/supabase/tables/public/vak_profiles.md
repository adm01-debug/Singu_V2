# public.vak_profiles

> SINGU: Perfis VAK (Visual, Auditivo, Cinestésico) dos contatos

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
| usada por views | public.vw_closing_score_ranking, public.vw_communication_dashboard |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `user_id` | `uuid` | sim |  |  |  |
| 3 | `contact_id` | `uuid` | não |  |  |  |
| 4 | `visual_score` | `integer` | sim | `0` |  |  |
| 5 | `auditory_score` | `integer` | sim | `0` |  |  |
| 6 | `kinesthetic_score` | `integer` | sim | `0` |  |  |
| 7 | `digital_score` | `integer` | sim | `0` |  |  |
| 8 | `primary_modality` | `text` | sim |  |  |  |
| 9 | `secondary_modality` | `text` | sim |  |  |  |
| 10 | `confidence` | `numeric(3,2)` | sim |  |  |  |
| 11 | `signals_detected` | `jsonb` | sim | `'[]'::jsonb` |  |  |
| 12 | `communication_tips` | `jsonb` | sim | `'{}'::jsonb` |  |  |
| 13 | `interactions_analyzed` | `integer` | sim | `0` |  |  |
| 14 | `analyzed_at` | `timestamp with time zone` | sim |  |  |  |
| 15 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 16 | `updated_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| vak_profiles_auditory_score_check | CHECK | `CHECK (auditory_score >= 0 AND auditory_score <= 100)` |  |  | sim |
| vak_profiles_confidence_check | CHECK | `CHECK (confidence >= 0::numeric AND confidence <= 1::numeric)` |  |  | sim |
| vak_profiles_contact_id_fkey | FOREIGN KEY | `FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| vak_profiles_digital_score_check | CHECK | `CHECK (digital_score >= 0 AND digital_score <= 100)` |  |  | sim |
| vak_profiles_kinesthetic_score_check | CHECK | `CHECK (kinesthetic_score >= 0 AND kinesthetic_score <= 100)` |  |  | sim |
| vak_profiles_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| vak_profiles_primary_modality_check | CHECK | `CHECK (primary_modality = ANY (ARRAY['visual'::text, 'auditory'::text, 'kinesthetic'::text, 'digital'::text]))` |  |  | sim |
| vak_profiles_secondary_modality_check | CHECK | `CHECK (secondary_modality = ANY (ARRAY['visual'::text, 'auditory'::text, 'kinesthetic'::text, 'digital'::text]))` |  |  | sim |
| vak_profiles_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| vak_profiles_visual_score_check | CHECK | `CHECK (visual_score >= 0 AND visual_score <= 100)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_vak_unique | btree | contact_id | sim | sim |  | `CREATE UNIQUE INDEX idx_vak_unique ON public.vak_profiles USING btree (contact_id)` |
| vak_profiles_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX vak_profiles_pkey ON public.vak_profiles USING btree (id)` |


## Policies (RLS)

### `service_role_full_vak_profiles`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | service_role |
| USING | `true` |
| WITH CHECK | `true` |

### `vak_profiles_owner_access`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(contact_id IN ( SELECT c.id    FROM contacts c   WHERE (c.user_id = ( SELECT auth.uid() AS uid))))` |
| WITH CHECK | `(contact_id IN ( SELECT c.id    FROM contacts c   WHERE (c.user_id = ( SELECT auth.uid() AS uid))))` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| set_owner_from_contact | BEFORE | INSERT OR UPDATE | ROW | enabled | public.set_owner_from_contact |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
