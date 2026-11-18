# public.sales_activities

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
| 2 | `sale_id` | `uuid` | sim |  |  |  |
| 3 | `salesperson_id` | `uuid` | sim |  |  |  |
| 4 | `activity_type` | `activity_type` | não |  |  |  |
| 5 | `outcome` | `activity_outcome` | não |  |  |  |
| 6 | `notes` | `text` | sim |  |  |  |
| 7 | `duration_minutes` | `integer` | sim |  |  |  |
| 8 | `contact_name` | `text` | sim |  |  |  |
| 9 | `deleted_at` | `timestamp with time zone` | sim |  |  |  |
| 10 | `deleted_by` | `uuid` | sim |  |  |  |
| 11 | `delete_reason` | `text` | sim |  |  |  |
| 12 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| sales_activities_deleted_by_fkey | FOREIGN KEY | `FOREIGN KEY (deleted_by) REFERENCES auth.users(id)` | NO ACTION | NO ACTION | sim |
| sales_activities_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| sales_activities_sale_id_fkey | FOREIGN KEY | `FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| sales_activities_salesperson_id_fkey | FOREIGN KEY | `FOREIGN KEY (salesperson_id) REFERENCES salespeople(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_sales_activities_deleted_by | btree | deleted_by | não | sim |  | `CREATE INDEX idx_sales_activities_deleted_by ON public.sales_activities USING btree (deleted_by)` |
| idx_sales_activities_sale_id | btree | sale_id | não | sim |  | `CREATE INDEX idx_sales_activities_sale_id ON public.sales_activities USING btree (sale_id)` |
| idx_sales_activities_salesperson_id | btree | salesperson_id | não | sim |  | `CREATE INDEX idx_sales_activities_salesperson_id ON public.sales_activities USING btree (salesperson_id)` |
| sales_activities_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX sales_activities_pkey ON public.sales_activities USING btree (id)` |


## Policies (RLS)

### `legacy_sales_activities_owner`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `((EXISTS ( SELECT 1    FROM salespeople sp   WHERE ((sp.id = sales_activities.salesperson_id) AND (sp.auth_user_id = ( SELECT auth.uid() AS uid))))) AND ((sale_id IS NULL) OR (EXISTS ( SELECT 1    FROM sales s   WHERE (s.id = sales_activities.sale_id)))))` |
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

_nenhum_


## Grants

| role | privilégios |
|---|---|
| authenticated | SELECT |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
