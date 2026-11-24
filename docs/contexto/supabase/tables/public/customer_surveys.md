# public.customer_surveys

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
| 3 | `contact_id` | `uuid` | sim |  |  |  |
| 4 | `survey_type` | `text` | não |  |  |  |
| 5 | `score` | `integer` | sim |  |  |  |
| 6 | `feedback` | `text` | sim |  |  |  |
| 7 | `category` | `text` | sim |  |  |  |
| 8 | `tags` | `text[]` | sim |  |  |  |
| 9 | `sent_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 10 | `responded_at` | `timestamp with time zone` | sim |  |  |  |
| 11 | `sent_by` | `uuid` | sim |  |  |  |
| 12 | `metadata` | `jsonb` | sim | `'{}'::jsonb` |  |  |
| 13 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| customer_surveys_company_id_fkey | FOREIGN KEY | `FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| customer_surveys_contact_id_fkey | FOREIGN KEY | `FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| customer_surveys_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| customer_surveys_sent_by_fkey | FOREIGN KEY | `FOREIGN KEY (sent_by) REFERENCES profiles(id)` | NO ACTION | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| customer_surveys_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX customer_surveys_pkey ON public.customer_surveys USING btree (id)` |
| idx_customer_surveys_contact_id_fk | btree | contact_id | não | sim |  | `CREATE INDEX idx_customer_surveys_contact_id_fk ON public.customer_surveys USING btree (contact_id)` |
| idx_customer_surveys_sent_by | btree | sent_by | não | sim |  | `CREATE INDEX idx_customer_surveys_sent_by ON public.customer_surveys USING btree (sent_by)` |
| idx_surveys_company | btree | company_id | não | sim |  | `CREATE INDEX idx_surveys_company ON public.customer_surveys USING btree (company_id)` |


## Policies (RLS)

### `customer_surveys_owner_or_admin_mfa_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `((((company_id IS NOT NULL) OR (contact_id IS NOT NULL)) AND ((company_id IS NULL) OR (EXISTS ( SELECT 1    FROM companies c   WHERE ((c.id = customer_surveys.company_id) AND (c.deleted_at IS NULL) AND (c.user_id = ( SELECT auth.uid() AS uid)))))) AND ((contact_id IS NULL) OR (EXISTS ( SELECT 1    FROM contacts c   WHERE ((c.id = customer_surveys.contact_id) AND (c.deleted_at IS NULL) AND (c.user_id = ( SELECT auth.uid() AS uid))))))) OR (( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role) AND (( SELECT (auth.jwt() ->> 'aal'::text)) = 'aal2'::text)))` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
