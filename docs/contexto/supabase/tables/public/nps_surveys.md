# public.nps_surveys

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
| 4 | `score` | `integer` | sim |  |  |  |
| 5 | `feedback` | `text` | sim |  |  |  |
| 6 | `category` | `text` | sim | ` CASE     WHEN (score >= 9) THEN 'promoter'::text     WHEN (score >= 7) THEN 'passive'::text     ELSE 'detractor'::text END` | s |  |
| 7 | `sent_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 8 | `responded_at` | `timestamp with time zone` | sim |  |  |  |
| 9 | `follow_up_done` | `boolean` | sim | `false` |  |  |
| 10 | `follow_up_notes` | `text` | sim |  |  |  |
| 11 | `created_by` | `uuid` | sim |  |  |  |
| 12 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| nps_surveys_company_id_fkey | FOREIGN KEY | `FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| nps_surveys_contact_id_fkey | FOREIGN KEY | `FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| nps_surveys_created_by_fkey | FOREIGN KEY | `FOREIGN KEY (created_by) REFERENCES profiles(id)` | NO ACTION | NO ACTION | sim |
| nps_surveys_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| nps_surveys_score_check | CHECK | `CHECK (score >= 0 AND score <= 10)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_nps_surveys_company | btree | company_id | não | sim |  | `CREATE INDEX idx_nps_surveys_company ON public.nps_surveys USING btree (company_id)` |
| idx_nps_surveys_contact_id_fk | btree | contact_id | não | sim |  | `CREATE INDEX idx_nps_surveys_contact_id_fk ON public.nps_surveys USING btree (contact_id)` |
| idx_nps_surveys_created_by | btree | created_by | não | sim |  | `CREATE INDEX idx_nps_surveys_created_by ON public.nps_surveys USING btree (created_by)` |
| nps_surveys_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX nps_surveys_pkey ON public.nps_surveys USING btree (id)` |


## Policies (RLS)

### `nps_surveys_owner_or_admin_mfa_all`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `((((company_id IS NOT NULL) OR (contact_id IS NOT NULL) OR (created_by = ( SELECT auth.uid() AS uid))) AND ((company_id IS NULL) OR (EXISTS ( SELECT 1    FROM companies c   WHERE ((c.id = nps_surveys.company_id) AND (c.deleted_at IS NULL) AND (c.user_id = ( SELECT auth.uid() AS uid)))))) AND ((contact_id IS NULL) OR (EXISTS ( SELECT 1    FROM contacts c   WHERE ((c.id = nps_surveys.contact_id) AND (c.deleted_at IS NULL) AND (c.user_id = ( SELECT auth.uid() AS uid))))))) OR (( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role) AND (( SELECT (auth.jwt() ->> 'aal'::text)) = 'aal2'::text)))` |
| WITH CHECK | `((((company_id IS NOT NULL) OR (contact_id IS NOT NULL) OR (created_by = ( SELECT auth.uid() AS uid))) AND ((company_id IS NULL) OR (EXISTS ( SELECT 1    FROM companies c   WHERE ((c.id = nps_surveys.company_id) AND (c.deleted_at IS NULL) AND (c.user_id = ( SELECT auth.uid() AS uid)))))) AND ((contact_id IS NULL) OR (EXISTS ( SELECT 1    FROM contacts c   WHERE ((c.id = nps_surveys.contact_id) AND (c.deleted_at IS NULL) AND (c.user_id = ( SELECT auth.uid() AS uid))))))) OR (( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role) AND (( SELECT (auth.jwt() ->> 'aal'::text)) = 'aal2'::text)))` |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
