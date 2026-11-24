# public.customer_health_scores

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
| 2 | `company_id` | `uuid` | sim |  |  |  |
| 3 | `score_date` | `date` | sim | `CURRENT_DATE` |  |  |
| 4 | `health_score` | `integer` | sim | `0` |  |  |
| 5 | `engagement_level` | `text` | sim |  |  |  |
| 6 | `satisfaction_score` | `integer` | sim |  |  |  |
| 7 | `product_usage_score` | `integer` | sim |  |  |  |
| 8 | `relationship_score` | `integer` | sim |  |  |  |
| 9 | `payment_score` | `integer` | sim |  |  |  |
| 10 | `risk_factors` | `jsonb` | sim | `'[]'::jsonb` |  |  |
| 11 | `opportunities` | `jsonb` | sim | `'[]'::jsonb` |  |  |
| 12 | `recommended_actions` | `jsonb` | sim | `'[]'::jsonb` |  |  |
| 13 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| customer_health_scores_company_id_fkey | FOREIGN KEY | `FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| customer_health_scores_company_id_score_date_key | UNIQUE | `UNIQUE (company_id, score_date)` |  |  | sim |
| customer_health_scores_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| customer_health_scores_company_id_score_date_key | btree | company_id, score_date | sim | sim |  | `CREATE UNIQUE INDEX customer_health_scores_company_id_score_date_key ON public.customer_health_scores USING btree (company_id, score_date)` |
| customer_health_scores_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX customer_health_scores_pkey ON public.customer_health_scores USING btree (id)` |
| idx_customer_health_scores_company_id | btree | company_id | não | sim |  | `CREATE INDEX idx_customer_health_scores_company_id ON public.customer_health_scores USING btree (company_id)` |


## Policies (RLS)

### `customer_health_scores_owner_or_admin_mfa_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `((EXISTS ( SELECT 1    FROM companies c   WHERE ((c.id = customer_health_scores.company_id) AND (c.deleted_at IS NULL) AND (c.user_id = ( SELECT auth.uid() AS uid))))) OR (( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role) AND (( SELECT (auth.jwt() ->> 'aal'::text)) = 'aal2'::text)))` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
