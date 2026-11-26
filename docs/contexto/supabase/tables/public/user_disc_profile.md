# public.user_disc_profile

> SINGU: Perfil DISC do próprio usuário/vendedor

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
| usada por views | public.vw_disc_compatibility |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `user_id` | `uuid` | não |  |  |  |
| 3 | `d_score` | `integer` | sim |  |  |  |
| 4 | `i_score` | `integer` | sim |  |  |  |
| 5 | `s_score` | `integer` | sim |  |  |  |
| 6 | `c_score` | `integer` | sim |  |  |  |
| 7 | `primary_profile` | `text` | sim |  |  |  |
| 8 | `secondary_profile` | `text` | sim |  |  |  |
| 9 | `assessment_method` | `text` | sim |  |  |  |
| 10 | `assessed_at` | `timestamp with time zone` | sim |  |  |  |
| 11 | `is_current` | `boolean` | sim | `true` |  |  |
| 12 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 13 | `updated_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| user_disc_profile_assessment_method_check | CHECK | `CHECK (assessment_method = ANY (ARRAY['questionnaire'::text, 'self_reported'::text, 'manager_assigned'::text, 'imported'::text]))` |  |  | sim |
| user_disc_profile_c_score_check | CHECK | `CHECK (c_score >= 0 AND c_score <= 100)` |  |  | sim |
| user_disc_profile_d_score_check | CHECK | `CHECK (d_score >= 0 AND d_score <= 100)` |  |  | sim |
| user_disc_profile_i_score_check | CHECK | `CHECK (i_score >= 0 AND i_score <= 100)` |  |  | sim |
| user_disc_profile_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| user_disc_profile_primary_profile_check | CHECK | `CHECK (primary_profile = ANY (ARRAY['D'::text, 'I'::text, 'S'::text, 'C'::text]))` |  |  | sim |
| user_disc_profile_s_score_check | CHECK | `CHECK (s_score >= 0 AND s_score <= 100)` |  |  | sim |
| user_disc_profile_secondary_profile_check | CHECK | `CHECK (secondary_profile = ANY (ARRAY['D'::text, 'I'::text, 'S'::text, 'C'::text]))` |  |  | sim |
| user_disc_profile_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_user_disc_current | btree | user_id | sim | sim | `(is_current = true)` | `CREATE UNIQUE INDEX idx_user_disc_current ON public.user_disc_profile USING btree (user_id) WHERE (is_current = true)` |
| user_disc_profile_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX user_disc_profile_pkey ON public.user_disc_profile USING btree (id)` |


## Policies (RLS)

### `service_role_full_user_disc_profile`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | service_role |
| USING | `true` |
| WITH CHECK | `true` |

### `user_disc_profile_owner_access`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(user_id = ( SELECT auth.uid() AS uid))` |
| WITH CHECK | `(user_id = ( SELECT auth.uid() AS uid))` |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
