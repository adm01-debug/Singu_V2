# public.deal_items

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
| 2 | `deal_id` | `uuid` | sim |  |  |  |
| 3 | `product_id` | `uuid` | sim |  |  |  |
| 4 | `product_name` | `text` | sim |  |  |  |
| 5 | `quantity` | `integer` | sim | `1` |  |  |
| 6 | `unit_price` | `numeric` | sim | `0` |  |  |
| 7 | `discount_percent` | `numeric` | sim | `0` |  |  |
| 8 | `total_price` | `numeric` | sim | `(((quantity)::numeric * unit_price) * ((1)::numeric - (discount_percent / (100)::numeric)))` | s |  |
| 9 | `notes` | `text` | sim |  |  |  |
| 10 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| deal_items_deal_id_fkey | FOREIGN KEY | `FOREIGN KEY (deal_id) REFERENCES deals(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| deal_items_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| deal_items_product_id_fkey | FOREIGN KEY | `FOREIGN KEY (product_id) REFERENCES products(id)` | NO ACTION | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| deal_items_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX deal_items_pkey ON public.deal_items USING btree (id)` |
| idx_deal_items_deal_id | btree | deal_id | não | sim |  | `CREATE INDEX idx_deal_items_deal_id ON public.deal_items USING btree (deal_id)` |
| idx_deal_items_product_id | btree | product_id | não | sim |  | `CREATE INDEX idx_deal_items_product_id ON public.deal_items USING btree (product_id)` |


## Policies (RLS)

### `deal_items_owner_or_admin_mfa_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `((EXISTS ( SELECT 1    FROM deals d   WHERE ((d.id = deal_items.deal_id) AND (d.user_id = ( SELECT auth.uid() AS uid))))) OR (( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role) AND (( SELECT (auth.jwt() ->> 'aal'::text)) = 'aal2'::text)))` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
