# public.email_logs

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


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `function_name` | `text` | não |  |  |  |
| 3 | `recipient_email` | `text` | não |  |  |  |
| 4 | `subject` | `text` | sim |  |  |  |
| 5 | `status` | `text` | não | `'sent'::text` |  |  |
| 6 | `error_message` | `text` | sim |  |  |  |
| 7 | `metadata` | `jsonb` | sim | `'{}'::jsonb` |  |  |
| 8 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 9 | `company_id` | `uuid` | sim |  |  |  |
| 10 | `contact_id` | `uuid` | sim |  |  |  |
| 11 | `direction` | `text` | sim |  |  |  |
| 12 | `body_preview` | `text` | sim |  |  |  |
| 13 | `opened_at` | `timestamp with time zone` | sim |  |  |  |
| 14 | `clicked_at` | `timestamp with time zone` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| email_logs_company_id_fkey | FOREIGN KEY | `FOREIGN KEY (company_id) REFERENCES companies(id)` | NO ACTION | NO ACTION | sim |
| email_logs_contact_id_fkey | FOREIGN KEY | `FOREIGN KEY (contact_id) REFERENCES contacts(id)` | NO ACTION | NO ACTION | sim |
| email_logs_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| _dormant.email_tracking_events | email_tracking_events_email_id_fkey | email_id | CASCADE |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| email_logs_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX email_logs_pkey ON public.email_logs USING btree (id)` |
| idx_email_logs_company | btree | company_id | não | sim |  | `CREATE INDEX idx_email_logs_company ON public.email_logs USING btree (company_id)` |
| idx_email_logs_contact_id_fk | btree | contact_id | não | sim |  | `CREATE INDEX idx_email_logs_contact_id_fk ON public.email_logs USING btree (contact_id)` |


## Policies (RLS)

### `email_logs_insert`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |

### `email_logs_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
