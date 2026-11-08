# public.churn_predictions

> Previsões de probabilidade de churn por contato

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
| usada por views | public.vw_churn_risk_ranking |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `uuid_generate_v4()` |  |  |
| 2 | `contact_id` | `uuid` | não |  |  |  |
| 3 | `company_id` | `uuid` | sim |  |  |  |
| 4 | `user_id` | `uuid` | não |  |  |  |
| 5 | `churn_probability` | `numeric(5,2)` | não |  |  |  |
| 6 | `confidence_level` | `numeric(5,2)` | sim | `50` |  |  |
| 7 | `risk_level` | `character varying(20)` | não |  |  |  |
| 8 | `recency_factor` | `numeric(5,2)` | sim |  |  |  |
| 9 | `frequency_factor` | `numeric(5,2)` | sim |  |  |  |
| 10 | `engagement_factor` | `numeric(5,2)` | sim |  |  |  |
| 11 | `sentiment_factor` | `numeric(5,2)` | sim |  |  |  |
| 12 | `risk_factors` | `jsonb` | sim |  |  |  |
| 13 | `recommended_actions` | `text[]` | sim |  |  |  |
| 14 | `predicted_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 15 | `valid_until` | `timestamp with time zone` | sim | `(now() + '30 days'::interval)` |  |  |
| 16 | `is_current` | `boolean` | sim | `true` |  |  |
| 17 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 18 | `updated_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| churn_predictions_company_id_fkey | FOREIGN KEY | `FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| churn_predictions_contact_id_fkey | FOREIGN KEY | `FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| churn_predictions_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| churn_predictions_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES profiles(id)` | NO ACTION | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| churn_predictions_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX churn_predictions_pkey ON public.churn_predictions USING btree (id)` |
| idx_churn_predictions_company_id | btree | company_id | não | sim |  | `CREATE INDEX idx_churn_predictions_company_id ON public.churn_predictions USING btree (company_id)` |
| idx_churn_predictions_contact | btree | contact_id | não | sim |  | `CREATE INDEX idx_churn_predictions_contact ON public.churn_predictions USING btree (contact_id)` |
| idx_churn_predictions_user_id | btree | user_id | não | sim |  | `CREATE INDEX idx_churn_predictions_user_id ON public.churn_predictions USING btree (user_id)` |


## Policies (RLS)

### `churn_predictions_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(user_id = ( SELECT auth.uid() AS uid))` |
| WITH CHECK |  |

### `service_full`

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
| set_updated_at | BEFORE | UPDATE | ROW | enabled | public.set_updated_at |
| update_churn_predictions_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
