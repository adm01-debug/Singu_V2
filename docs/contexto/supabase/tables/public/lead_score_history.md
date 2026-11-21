# public.lead_score_history

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
| 2 | `company_id` | `uuid` | sim |  |  |  |
| 3 | `score_date` | `date` | sim | `CURRENT_DATE` |  |  |
| 4 | `lead_score` | `integer` | sim |  |  |  |
| 5 | `engagement_score` | `integer` | sim |  |  |  |
| 6 | `fit_score` | `integer` | sim |  |  |  |
| 7 | `behavior_score` | `integer` | sim |  |  |  |
| 8 | `factors` | `jsonb` | sim | `'{}'::jsonb` |  |  |
| 9 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 10 | `contact_id` | `uuid` | sim |  |  |  |
| 11 | `user_id` | `uuid` | sim |  |  |  |
| 12 | `total_score` | `numeric(5,2)` | sim |  |  |  |
| 13 | `grade` | `text` | sim |  |  |  |
| 14 | `intent_score` | `numeric(5,2)` | não | `0` |  |  |
| 15 | `relationship_score` | `numeric(5,2)` | não | `0` |  |  |
| 16 | `recorded_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| lead_score_history_company_id_fkey | FOREIGN KEY | `FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| lead_score_history_company_id_score_date_key | UNIQUE | `UNIQUE (company_id, score_date)` |  |  | sim |
| lead_score_history_contact_id_fkey | FOREIGN KEY | `FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| lead_score_history_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_lead_score_history_company_id | btree | company_id | não | sim |  | `CREATE INDEX idx_lead_score_history_company_id ON public.lead_score_history USING btree (company_id)` |
| idx_lead_score_history_contact | btree | contact_id, recorded_at | não | sim |  | `CREATE INDEX idx_lead_score_history_contact ON public.lead_score_history USING btree (contact_id, recorded_at DESC)` |
| idx_lead_score_history_user | btree | user_id, recorded_at | não | sim |  | `CREATE INDEX idx_lead_score_history_user ON public.lead_score_history USING btree (user_id, recorded_at DESC)` |
| idx_lead_score_history_user_id | btree | user_id | não | sim |  | `CREATE INDEX idx_lead_score_history_user_id ON public.lead_score_history USING btree (user_id)` |
| lead_score_history_company_id_score_date_key | btree | company_id, score_date | sim | sim |  | `CREATE UNIQUE INDEX lead_score_history_company_id_score_date_key ON public.lead_score_history USING btree (company_id, score_date)` |
| lead_score_history_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX lead_score_history_pkey ON public.lead_score_history USING btree (id)` |


## Policies (RLS)

### `Users can insert their own score history`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |

### `Users can view their own score history`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `Users own data`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
