# public.deal_items

> Linhas de produto/serviço associadas a uma oportunidade de public.deals. Registra quantidade, preço, desconto e total calculado. deal_id referencia public.deals.id; product_id referencia public.products.id.

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
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  | Identificador UUID do item de oportunidade e chave primária; gerado por gen_random_uuid(). |
| 2 | `deal_id` | `uuid` | sim |  |  | Oportunidade à qual pertence a linha; FK para public.deals.id. |
| 3 | `product_id` | `uuid` | sim |  |  | Produto do catálogo associado; FK para public.products.id. Pode ser nulo para item sem vínculo cadastral. |
| 4 | `product_name` | `text` | sim |  |  | Snapshot textual do nome do produto na oportunidade; pode ser nulo. |
| 5 | `quantity` | `integer` | sim | `1` |  | Quantidade do item; integer, DEFAULT 1. Unidade de medida depende do produto. |
| 6 | `unit_price` | `numeric` | sim | `0` |  | Preço unitário da linha; numeric, DEFAULT 0. Moeda não especificada no schema. |
| 7 | `discount_percent` | `numeric` | sim | `0` |  | Percentual de desconto aplicado à linha; numeric, DEFAULT 0. A fórmula usa o valor dividido por 100. |
| 8 | `total_price` | `numeric` | sim | `(((quantity)::numeric * unit_price) * ((1)::numeric - (discount_percent / (100)::numeric)))` | s | Total calculado automaticamente: quantity × unit_price × (1 − discount_percent/100). Coluna GENERATED; não tratar como entrada independente. |
| 9 | `notes` | `text` | sim |  |  | Observações textuais opcionais sobre a linha do negócio. |
| 10 | `created_at` | `timestamp with time zone` | sim | `now()` |  | Data e hora de criação da linha; timestamptz, DEFAULT now(). |


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
