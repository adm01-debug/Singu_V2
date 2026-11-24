# public.sales_opportunities

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
| 3 | `opportunity_type` | `text` | não |  |  |  |
| 4 | `title` | `text` | não |  |  |  |
| 5 | `description` | `text` | sim |  |  |  |
| 6 | `estimated_value` | `numeric` | sim | `0` |  |  |
| 7 | `confidence_score` | `integer` | sim | `50` |  |  |
| 8 | `priority` | `text` | sim | `'medium'::text` |  |  |
| 9 | `status` | `text` | sim | `'identified'::text` |  |  |
| 10 | `source` | `text` | sim | `'system'::text` |  |  |
| 11 | `identified_by` | `uuid` | sim |  |  |  |
| 12 | `assigned_to` | `uuid` | sim |  |  |  |
| 13 | `due_date` | `date` | sim |  |  |  |
| 14 | `notes` | `text` | sim |  |  |  |
| 15 | `metadata` | `jsonb` | sim | `'{}'::jsonb` |  |  |
| 16 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 17 | `updated_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| chk_sales_opportunities_priority | CHECK | `CHECK (priority = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text, 'urgent'::text]))` |  |  | sim |
| chk_sales_opportunities_status | CHECK | `CHECK (status = ANY (ARRAY['identified'::text, 'qualified'::text, 'proposal'::text, 'negotiation'::text, 'won'::text, 'lost'::text, 'on_hold'::text]))` |  |  | sim |
| sales_opportunities_assigned_to_fkey | FOREIGN KEY | `FOREIGN KEY (assigned_to) REFERENCES profiles(id)` | NO ACTION | NO ACTION | sim |
| sales_opportunities_company_id_fkey | FOREIGN KEY | `FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| sales_opportunities_identified_by_fkey | FOREIGN KEY | `FOREIGN KEY (identified_by) REFERENCES profiles(id)` | NO ACTION | NO ACTION | sim |
| sales_opportunities_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_opportunities_company | btree | company_id | não | sim |  | `CREATE INDEX idx_opportunities_company ON public.sales_opportunities USING btree (company_id)` |
| idx_sales_opportunities_assigned_to | btree | assigned_to | não | sim |  | `CREATE INDEX idx_sales_opportunities_assigned_to ON public.sales_opportunities USING btree (assigned_to)` |
| idx_sales_opportunities_identified_by | btree | identified_by | não | sim |  | `CREATE INDEX idx_sales_opportunities_identified_by ON public.sales_opportunities USING btree (identified_by)` |
| sales_opportunities_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX sales_opportunities_pkey ON public.sales_opportunities USING btree (id)` |


## Policies (RLS)

### `sales_opportunities_owner_or_admin_mfa_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(((company_id IS NOT NULL) AND (EXISTS ( SELECT 1    FROM companies c   WHERE ((c.id = sales_opportunities.company_id) AND (c.deleted_at IS NULL) AND (c.user_id = ( SELECT auth.uid() AS uid)))))) OR ((company_id IS NULL) AND ((identified_by = ( SELECT auth.uid() AS uid)) OR (assigned_to = ( SELECT auth.uid() AS uid)))) OR (( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role) AND (( SELECT (auth.jwt() ->> 'aal'::text)) = 'aal2'::text)))` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| trg_sales_opportunities_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
