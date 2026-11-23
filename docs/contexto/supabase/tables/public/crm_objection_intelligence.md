# public.crm_objection_intelligence

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
| 2 | `contact_id` | `uuid` | sim |  |  |  |
| 3 | `objection_type` | `text` | não |  |  |  |
| 4 | `behavioral_profile` | `text` | sim |  |  |  |
| 5 | `suggested_strategy` | `text` | sim |  |  |  |
| 6 | `script_content` | `text` | sim |  |  |  |
| 7 | `success_rate` | `numeric(5,2)` | sim | `0` |  |  |
| 8 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 9 | `updated_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| crm_objection_intelligence_contact_id_fkey | FOREIGN KEY | `FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| crm_objection_intelligence_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| crm_objection_intelligence_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX crm_objection_intelligence_pkey ON public.crm_objection_intelligence USING btree (id)` |
| idx_objection_contact_id | btree | contact_id | não | sim |  | `CREATE INDEX idx_objection_contact_id ON public.crm_objection_intelligence USING btree (contact_id)` |
| idx_objection_type | btree | objection_type | não | sim |  | `CREATE INDEX idx_objection_type ON public.crm_objection_intelligence USING btree (objection_type)` |


## Policies (RLS)

### `crm_objection_intelligence_contact_owner_or_admin`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `((EXISTS ( SELECT 1    FROM contacts c   WHERE ((c.id = crm_objection_intelligence.contact_id) AND (c.deleted_at IS NULL) AND (c.user_id = ( SELECT auth.uid() AS uid))))) OR ( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role))` |
| WITH CHECK | `((EXISTS ( SELECT 1    FROM contacts c   WHERE ((c.id = crm_objection_intelligence.contact_id) AND (c.deleted_at IS NULL) AND (c.user_id = ( SELECT auth.uid() AS uid))))) OR ( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role))` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| update_crm_objection_intelligence_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
