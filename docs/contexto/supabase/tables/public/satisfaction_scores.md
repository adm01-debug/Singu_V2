# public.satisfaction_scores

> Scores de satisfação e NPS dos clientes

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
| usada por views | public.vw_satisfaction_trend |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `uuid_generate_v4()` |  |  |
| 2 | `contact_id` | `uuid` | não |  |  |  |
| 3 | `company_id` | `uuid` | sim |  |  |  |
| 4 | `user_id` | `uuid` | sim |  |  |  |
| 5 | `overall_score` | `integer` | sim |  |  |  |
| 6 | `product_score` | `integer` | sim |  |  |  |
| 7 | `service_score` | `integer` | sim |  |  |  |
| 8 | `support_score` | `integer` | sim |  |  |  |
| 9 | `nps_score` | `integer` | sim |  |  |  |
| 10 | `nps_category` | `character varying(20)` | sim |  |  |  |
| 11 | `feedback_text` | `text` | sim |  |  |  |
| 12 | `improvement_suggestions` | `text[]` | sim |  |  |  |
| 13 | `survey_type` | `character varying(50)` | sim |  |  |  |
| 14 | `survey_channel` | `character varying(50)` | sim |  |  |  |
| 15 | `collected_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 16 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| satisfaction_scores_company_id_fkey | FOREIGN KEY | `FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| satisfaction_scores_contact_id_fkey | FOREIGN KEY | `FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| satisfaction_scores_nps_score_check | CHECK | `CHECK (nps_score >= 0 AND nps_score <= 10)` |  |  | sim |
| satisfaction_scores_overall_score_check | CHECK | `CHECK (overall_score >= 0 AND overall_score <= 100)` |  |  | sim |
| satisfaction_scores_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| satisfaction_scores_product_score_check | CHECK | `CHECK (product_score >= 0 AND product_score <= 100)` |  |  | sim |
| satisfaction_scores_service_score_check | CHECK | `CHECK (service_score >= 0 AND service_score <= 100)` |  |  | sim |
| satisfaction_scores_support_score_check | CHECK | `CHECK (support_score >= 0 AND support_score <= 100)` |  |  | sim |
| satisfaction_scores_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES profiles(id)` | NO ACTION | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| satisfaction_scores_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX satisfaction_scores_pkey ON public.satisfaction_scores USING btree (id)` |


## Policies (RLS)

### `satisfaction_scores_owner_access`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(contact_id IN ( SELECT c.id    FROM contacts c   WHERE (c.user_id = ( SELECT auth.uid() AS uid))))` |
| WITH CHECK | `(contact_id IN ( SELECT c.id    FROM contacts c   WHERE (c.user_id = ( SELECT auth.uid() AS uid))))` |

### `service_role_full_satisfaction_scores`

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
