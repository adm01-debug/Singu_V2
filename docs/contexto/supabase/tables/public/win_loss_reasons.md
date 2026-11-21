# public.win_loss_reasons

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
| 3 | `category` | `text` | não |  |  |  |
| 4 | `label` | `text` | não |  |  |  |
| 5 | `outcome_type` | `text` | não | `'both'::text` |  |  |
| 6 | `active` | `boolean` | não | `true` |  |  |
| 7 | `sort_order` | `integer` | não | `0` |  |  |
| 8 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 9 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| win_loss_reasons_category_check | CHECK | `CHECK (category = ANY (ARRAY['price'::text, 'product'::text, 'timing'::text, 'relationship'::text, 'competition'::text, 'budget'::text, 'authority'::text, 'need'::text, 'other'::text]))` |  |  | sim |
| win_loss_reasons_outcome_type_check | CHECK | `CHECK (outcome_type = ANY (ARRAY['won'::text, 'lost'::text, 'both'::text]))` |  |  | sim |
| win_loss_reasons_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| win_loss_reasons_user_id_category_label_key | UNIQUE | `UNIQUE (user_id, category, label)` |  |  | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.win_loss_records | win_loss_records_primary_reason_id_fkey | primary_reason_id | SET NULL |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_win_loss_reasons_user | btree | user_id, active | não | sim |  | `CREATE INDEX idx_win_loss_reasons_user ON public.win_loss_reasons USING btree (user_id, active)` |
| win_loss_reasons_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX win_loss_reasons_pkey ON public.win_loss_reasons USING btree (id)` |
| win_loss_reasons_user_id_category_label_key | btree | user_id, category, label | sim | sim |  | `CREATE UNIQUE INDEX win_loss_reasons_user_id_category_label_key ON public.win_loss_reasons USING btree (user_id, category, label)` |


## Policies (RLS)

### `users manage own reasons`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| trg_win_loss_reasons_updated | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
