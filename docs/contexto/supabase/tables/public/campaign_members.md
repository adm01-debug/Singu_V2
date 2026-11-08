# public.campaign_members

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
| 2 | `campaign_id` | `uuid` | não |  |  |  |
| 3 | `company_id` | `uuid` | sim |  |  |  |
| 4 | `contact_id` | `uuid` | sim |  |  |  |
| 5 | `status` | `text` | sim | `'pending'::text` |  |  |
| 6 | `sent_at` | `timestamp with time zone` | sim |  |  |  |
| 7 | `opened_at` | `timestamp with time zone` | sim |  |  |  |
| 8 | `clicked_at` | `timestamp with time zone` | sim |  |  |  |
| 9 | `converted_at` | `timestamp with time zone` | sim |  |  |  |
| 10 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| campaign_members_campaign_id_fkey | FOREIGN KEY | `FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| campaign_members_company_id_fkey | FOREIGN KEY | `FOREIGN KEY (company_id) REFERENCES companies(id)` | NO ACTION | NO ACTION | sim |
| campaign_members_contact_id_fkey | FOREIGN KEY | `FOREIGN KEY (contact_id) REFERENCES contacts(id)` | NO ACTION | NO ACTION | sim |
| campaign_members_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| chk_campaign_members_status | CHECK | `CHECK (status = ANY (ARRAY['pending'::text, 'active'::text, 'completed'::text, 'bounced'::text, 'unsubscribed'::text, 'opted_out'::text]))` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| campaign_members_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX campaign_members_pkey ON public.campaign_members USING btree (id)` |
| idx_campaign_members_campaign_id | btree | campaign_id | não | sim |  | `CREATE INDEX idx_campaign_members_campaign_id ON public.campaign_members USING btree (campaign_id)` |
| idx_campaign_members_company_id_fk | btree | company_id | não | sim |  | `CREATE INDEX idx_campaign_members_company_id_fk ON public.campaign_members USING btree (company_id)` |
| idx_campaign_members_contact_id_fk | btree | contact_id | não | sim |  | `CREATE INDEX idx_campaign_members_contact_id_fk ON public.campaign_members USING btree (contact_id)` |
| idx_campaign_members_status | btree | status | não | sim |  | `CREATE INDEX idx_campaign_members_status ON public.campaign_members USING btree (status)` |
| uq_campaign_members_campaign_contact | btree | campaign_id, contact_id | sim | sim | `(contact_id IS NOT NULL)` | `CREATE UNIQUE INDEX uq_campaign_members_campaign_contact ON public.campaign_members USING btree (campaign_id, contact_id) WHERE (contact_id IS NOT NULL)` |


## Policies (RLS)

### `Authenticated read`

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
