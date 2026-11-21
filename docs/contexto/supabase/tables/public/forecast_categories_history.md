# public.forecast_categories_history

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
| 3 | `deal_forecast_id` | `uuid` | não |  |  |  |
| 4 | `from_category` | `text` | sim |  |  |  |
| 5 | `to_category` | `text` | não |  |  |  |
| 6 | `changed_by` | `text` | não | `'user'::text` |  |  |
| 7 | `reason` | `text` | sim |  |  |  |
| 8 | `changed_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| forecast_categories_history_changed_by_check | CHECK | `CHECK (changed_by = ANY (ARRAY['user'::text, 'ai'::text, 'system'::text]))` |  |  | sim |
| forecast_categories_history_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| forecast_categories_history_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX forecast_categories_history_pkey ON public.forecast_categories_history USING btree (id)` |
| idx_forecast_cat_history_df | btree | deal_forecast_id, changed_at | não | sim |  | `CREATE INDEX idx_forecast_cat_history_df ON public.forecast_categories_history USING btree (deal_forecast_id, changed_at DESC)` |


## Policies (RLS)

### `own forecast_cat_history insert`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |

### `own forecast_cat_history select`

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
