# public.contact_eq_scores

> Scores de Inteligência Emocional (EQ) dos contatos - 4 pilares de Goleman

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
| usada por views | public.vw_communication_dashboard, public.vw_eq_dashboard, public.vw_eq_evolution |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `uuid_generate_v4()` |  |  |
| 2 | `contact_id` | `uuid` | não |  |  |  |
| 3 | `user_id` | `uuid` | sim |  |  |  |
| 4 | `eq_score` | `integer` | sim |  |  |  |
| 5 | `eq_level` | `character varying(20)` | sim |  |  |  |
| 6 | `self_awareness_score` | `integer` | sim |  |  |  |
| 7 | `self_management_score` | `integer` | sim |  |  |  |
| 8 | `social_awareness_score` | `integer` | sim |  |  |  |
| 9 | `relationship_management_score` | `integer` | sim |  |  |  |
| 10 | `communication_style` | `character varying(50)` | sim |  |  |  |
| 11 | `preferred_approach` | `text` | sim |  |  |  |
| 12 | `emotional_stability` | `numeric(5,2)` | sim |  |  |  |
| 13 | `empathy_level` | `numeric(5,2)` | sim |  |  |  |
| 14 | `adaptability` | `numeric(5,2)` | sim |  |  |  |
| 15 | `stress_tolerance` | `numeric(5,2)` | sim |  |  |  |
| 16 | `sales_implications` | `text[]` | sim |  |  |  |
| 17 | `recommended_techniques` | `text[]` | sim |  |  |  |
| 18 | `avoid_techniques` | `text[]` | sim |  |  |  |
| 19 | `confidence_level` | `numeric(5,2)` | sim | `50` |  |  |
| 20 | `data_points_count` | `integer` | sim | `0` |  |  |
| 21 | `assessed_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 22 | `is_current` | `boolean` | sim | `true` |  |  |
| 23 | `notes` | `text` | sim |  |  |  |
| 24 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 25 | `updated_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| contact_eq_scores_contact_id_fkey | FOREIGN KEY | `FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| contact_eq_scores_eq_score_check | CHECK | `CHECK (eq_score >= 0 AND eq_score <= 100)` |  |  | sim |
| contact_eq_scores_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| contact_eq_scores_relationship_management_score_check | CHECK | `CHECK (relationship_management_score >= 0 AND relationship_management_score <= 100)` |  |  | sim |
| contact_eq_scores_self_awareness_score_check | CHECK | `CHECK (self_awareness_score >= 0 AND self_awareness_score <= 100)` |  |  | sim |
| contact_eq_scores_self_management_score_check | CHECK | `CHECK (self_management_score >= 0 AND self_management_score <= 100)` |  |  | sim |
| contact_eq_scores_social_awareness_score_check | CHECK | `CHECK (social_awareness_score >= 0 AND social_awareness_score <= 100)` |  |  | sim |
| contact_eq_scores_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES profiles(id)` | NO ACTION | NO ACTION | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| _dormant.eq_pillar_details | eq_pillar_details_eq_score_id_fkey | eq_score_id | CASCADE |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| contact_eq_scores_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX contact_eq_scores_pkey ON public.contact_eq_scores USING btree (id)` |


## Policies (RLS)

### `contact_eq_scores_owner_access`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(contact_id IN ( SELECT c.id    FROM contacts c   WHERE (c.user_id = ( SELECT auth.uid() AS uid))))` |
| WITH CHECK | `(contact_id IN ( SELECT c.id    FROM contacts c   WHERE (c.user_id = ( SELECT auth.uid() AS uid))))` |

### `service_role_full_contact_eq_scores`

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
