# _dormant.purchase_history

> SINGU: Histórico de compras dos contatos/empresas

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
| 2 | `user_id` | `uuid` | sim |  |  |  |
| 3 | `contact_id` | `uuid` | sim |  |  |  |
| 4 | `company_id` | `uuid` | sim |  |  |  |
| 5 | `order_reference` | `text` | sim |  |  |  |
| 6 | `external_order_id` | `text` | sim |  |  |  |
| 7 | `order_date` | `date` | não |  |  |  |
| 8 | `delivery_date` | `date` | sim |  |  |  |
| 9 | `total_value` | `numeric(15,2)` | não |  |  |  |
| 10 | `currency` | `text` | sim | `'BRL'::text` |  |  |
| 11 | `items_count` | `integer` | sim | `0` |  |  |
| 12 | `items_summary` | `text` | sim |  |  |  |
| 13 | `items_detail` | `jsonb` | sim | `'[]'::jsonb` |  |  |
| 14 | `main_category` | `text` | sim |  |  |  |
| 15 | `margin_value` | `numeric(15,2)` | sim |  |  |  |
| 16 | `margin_percent` | `numeric(5,2)` | sim |  |  |  |
| 17 | `status` | `text` | sim |  |  |  |
| 18 | `payment_method` | `text` | sim |  |  |  |
| 19 | `payment_status` | `text` | sim |  |  |  |
| 20 | `notes` | `text` | sim |  |  |  |
| 21 | `source` | `text` | sim |  |  |  |
| 22 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 23 | `updated_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| purchase_history_company_id_fkey | FOREIGN KEY | `FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| purchase_history_contact_id_fkey | FOREIGN KEY | `FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| purchase_history_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| purchase_history_status_check | CHECK | `CHECK (status = ANY (ARRAY['pending'::text, 'confirmed'::text, 'processing'::text, 'shipped'::text, 'delivered'::text, 'cancelled'::text, 'returned'::text, 'refunded'::text]))` |  |  | sim |
| purchase_history_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| purchase_history_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX purchase_history_pkey ON _dormant.purchase_history USING btree (id)` |


## Policies (RLS)

### `dormant_deny_all_purchase_history`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | RESTRICTIVE |
| roles | public |
| USING | `false` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| anon | SELECT |
| authenticated | SELECT |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
