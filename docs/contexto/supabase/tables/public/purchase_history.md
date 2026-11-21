# public.purchase_history

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 8 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `user_id` | `uuid` | não |  |  |  |
| 3 | `contact_id` | `uuid` | não |  |  |  |
| 4 | `company_id` | `uuid` | sim |  |  |  |
| 5 | `purchase_date` | `date` | não |  |  |  |
| 6 | `amount` | `numeric` | não |  |  |  |
| 7 | `currency` | `text` | sim | `'BRL'::text` |  |  |
| 8 | `product_category` | `text` | sim |  |  |  |
| 9 | `product_name` | `text` | sim |  |  |  |
| 10 | `quantity` | `integer` | sim | `1` |  |  |
| 11 | `external_reference` | `text` | sim |  |  |  |
| 12 | `metadata` | `jsonb` | sim |  |  |  |
| 13 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 14 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |
| 15 | `renewal_date` | `timestamp with time zone` | sim |  |  |  |
| 16 | `cycle_months` | `integer` | sim |  |  |  |
| 17 | `notes` | `text` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| purchase_history_contact_id_fkey | FOREIGN KEY | `FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| purchase_history_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_purchase_history_contact | btree | contact_id | não | sim |  | `CREATE INDEX idx_purchase_history_contact ON public.purchase_history USING btree (contact_id)` |
| idx_purchase_history_user | btree | user_id | não | sim |  | `CREATE INDEX idx_purchase_history_user ON public.purchase_history USING btree (user_id)` |
| idx_purchase_history_user_id | btree | user_id | não | sim |  | `CREATE INDEX idx_purchase_history_user_id ON public.purchase_history USING btree (user_id)` |
| purchase_history_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX purchase_history_pkey ON public.purchase_history USING btree (id)` |


## Policies (RLS)

### `Users can delete their own purchase history`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(auth.uid() = user_id)` |
| WITH CHECK |  |

### `Users can insert their own purchase history`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(auth.uid() = user_id)` |

### `Users can update their own purchase history`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(auth.uid() = user_id)` |
| WITH CHECK |  |

### `Users can view their own purchase history`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(auth.uid() = user_id)` |
| WITH CHECK |  |

### `purchase_history_delete`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `purchase_history_insert`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |

### `purchase_history_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `purchase_history_update`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| set_updated_at_purchase_history | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |
| update_purchase_history_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
