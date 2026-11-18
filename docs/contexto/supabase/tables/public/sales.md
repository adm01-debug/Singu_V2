# public.sales

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
| 2 | `client_name` | `text` | não |  |  |  |
| 3 | `product_name` | `text` | não |  |  |  |
| 4 | `amount` | `numeric(12,2)` | não |  |  |  |
| 5 | `status` | `text` | não | `'pending'::text` |  |  |
| 6 | `category` | `text` | não | `'subscription'::text` |  |  |
| 7 | `salesperson_id` | `uuid` | sim |  |  |  |
| 8 | `source` | `text` | sim | `'other'::text` |  |  |
| 9 | `deleted_at` | `timestamp with time zone` | sim |  |  |  |
| 10 | `deleted_by` | `uuid` | sim |  |  |  |
| 11 | `delete_reason` | `text` | sim |  |  |  |
| 12 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 13 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| sales_category_check | CHECK | `CHECK (category = ANY (ARRAY['subscription'::text, 'service'::text, 'project'::text, 'other'::text]))` |  |  | sim |
| sales_deleted_by_fkey | FOREIGN KEY | `FOREIGN KEY (deleted_by) REFERENCES auth.users(id)` | NO ACTION | NO ACTION | sim |
| sales_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| sales_salesperson_id_fkey | FOREIGN KEY | `FOREIGN KEY (salesperson_id) REFERENCES salespeople(id)` | NO ACTION | NO ACTION | sim |
| sales_status_check | CHECK | `CHECK (status = ANY (ARRAY['completed'::text, 'pending'::text, 'cancelled'::text, 'negotiation'::text, 'proposal'::text, 'qualification'::text, 'discovery'::text, 'lead'::text]))` |  |  | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| _dormant.deal_chat_history | deal_chat_history_deal_id_fkey | deal_id | CASCADE |
| _dormant.deal_outcomes | deal_outcomes_sale_id_fkey | sale_id | CASCADE |
| _dormant.deal_stage_history | deal_stage_history_sale_id_fkey | sale_id | CASCADE |
| _dormant.lead_scores | lead_scores_sale_id_fkey | sale_id | CASCADE |
| _dormant.playbook_progress | playbook_progress_sale_id_fkey | sale_id | CASCADE |
| _dormant.prospect_cadences | prospect_cadences_sale_id_fkey | sale_id | CASCADE |
| public.sales_activities | sales_activities_sale_id_fkey | sale_id | CASCADE |
| public.sales_tasks | sales_tasks_sale_id_fkey | sale_id | CASCADE |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_sales_created | btree | created_at | não | sim |  | `CREATE INDEX idx_sales_created ON public.sales USING btree (created_at DESC)` |
| idx_sales_deleted_by | btree | deleted_by | não | sim |  | `CREATE INDEX idx_sales_deleted_by ON public.sales USING btree (deleted_by)` |
| idx_sales_salesperson_id | btree | salesperson_id | não | sim |  | `CREATE INDEX idx_sales_salesperson_id ON public.sales USING btree (salesperson_id)` |
| sales_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX sales_pkey ON public.sales USING btree (id)` |


## Policies (RLS)

### `legacy_sales_owner`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(EXISTS ( SELECT 1    FROM salespeople sp   WHERE ((sp.id = sales.salesperson_id) AND (sp.auth_user_id = ( SELECT auth.uid() AS uid)))))` |
| WITH CHECK |  |

### `legacy_sales_service`

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
| update_sales_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | SELECT |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
