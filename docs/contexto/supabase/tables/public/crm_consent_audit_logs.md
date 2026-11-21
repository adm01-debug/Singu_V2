# public.crm_consent_audit_logs

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
| 2 | `user_id` | `uuid` | não |  |  |  |
| 3 | `contact_id` | `uuid` | não |  |  |  |
| 4 | `consent_type` | `text` | não |  |  |  |
| 5 | `status` | `text` | não |  |  |  |
| 6 | `source` | `text` | não |  |  |  |
| 7 | `ip_address` | `text` | sim |  |  |  |
| 8 | `platform` | `text` | sim |  |  |  |
| 9 | `metadata` | `jsonb` | sim | `'{}'::jsonb` |  |  |
| 10 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| crm_consent_audit_logs_contact_id_fkey | FOREIGN KEY | `FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| crm_consent_audit_logs_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| crm_consent_audit_logs_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| crm_consent_audit_logs_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX crm_consent_audit_logs_pkey ON public.crm_consent_audit_logs USING btree (id)` |
| idx_crm_consent_audit_contact_id | btree | contact_id | não | sim |  | `CREATE INDEX idx_crm_consent_audit_contact_id ON public.crm_consent_audit_logs USING btree (contact_id)` |
| idx_crm_consent_audit_user_id | btree | user_id | não | sim |  | `CREATE INDEX idx_crm_consent_audit_user_id ON public.crm_consent_audit_logs USING btree (user_id)` |


## Policies (RLS)

### `Users can insert their own consent logs`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
