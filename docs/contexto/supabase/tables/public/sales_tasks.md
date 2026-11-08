# public.sales_tasks

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
| 2 | `title` | `text` | não |  |  |  |
| 3 | `description` | `text` | sim |  |  |  |
| 4 | `type` | `task_type` | não | `'other'::task_type` |  |  |
| 5 | `priority` | `task_priority` | não | `'medium'::task_priority` |  |  |
| 6 | `status` | `task_status` | não | `'pending'::task_status` |  |  |
| 7 | `sale_id` | `uuid` | sim |  |  |  |
| 8 | `client_id` | `uuid` | sim |  |  |  |
| 9 | `salesperson_id` | `uuid` | sim |  |  |  |
| 10 | `due_date` | `timestamp with time zone` | sim |  |  |  |
| 11 | `completed_at` | `timestamp with time zone` | sim |  |  |  |
| 12 | `deleted_at` | `timestamp with time zone` | sim |  |  |  |
| 13 | `deleted_by` | `uuid` | sim |  |  |  |
| 14 | `delete_reason` | `text` | sim |  |  |  |
| 15 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 16 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| sales_tasks_client_id_fkey | FOREIGN KEY | `FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| sales_tasks_deleted_by_fkey | FOREIGN KEY | `FOREIGN KEY (deleted_by) REFERENCES auth.users(id)` | NO ACTION | NO ACTION | sim |
| sales_tasks_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| sales_tasks_sale_id_fkey | FOREIGN KEY | `FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| sales_tasks_salesperson_id_fkey | FOREIGN KEY | `FOREIGN KEY (salesperson_id) REFERENCES salespeople(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_sales_tasks_client_id | btree | client_id | não | sim |  | `CREATE INDEX idx_sales_tasks_client_id ON public.sales_tasks USING btree (client_id)` |
| idx_sales_tasks_deleted_by | btree | deleted_by | não | sim |  | `CREATE INDEX idx_sales_tasks_deleted_by ON public.sales_tasks USING btree (deleted_by)` |
| idx_sales_tasks_sale_id | btree | sale_id | não | sim |  | `CREATE INDEX idx_sales_tasks_sale_id ON public.sales_tasks USING btree (sale_id)` |
| idx_sales_tasks_sp | btree | salesperson_id | não | sim |  | `CREATE INDEX idx_sales_tasks_sp ON public.sales_tasks USING btree (salesperson_id)` |
| sales_tasks_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX sales_tasks_pkey ON public.sales_tasks USING btree (id)` |


## Policies (RLS)

### `sales_tasks_all`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |
| WITH CHECK | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| set_updated_at | BEFORE | UPDATE | ROW | enabled | public.set_updated_at |


## Grants

_nenhum_
