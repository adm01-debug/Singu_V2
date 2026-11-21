# public.marketing_roi_data

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
| 2 | `user_id` | `uuid` | não |  |  |  |
| 3 | `channel` | `text` | não |  |  |  |
| 4 | `investment` | `numeric(12,2)` | não | `0` |  |  |
| 5 | `period_start` | `date` | não |  |  |  |
| 6 | `period_end` | `date` | não |  |  |  |
| 7 | `leads_generated` | `integer` | sim | `0` |  |  |
| 8 | `customers_acquired` | `integer` | sim | `0` |  |  |
| 9 | `revenue_generated` | `numeric(12,2)` | sim | `0` |  |  |
| 10 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| marketing_roi_data_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| marketing_roi_data_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX marketing_roi_data_pkey ON public.marketing_roi_data USING btree (id)` |


## Policies (RLS)

### `Users can insert their own ROI data`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |

### `Users can view their own ROI data`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
