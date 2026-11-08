# public.customer_purchases

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
| usada por views | public.vw_rodizio_kpis |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `customer_id` | `uuid` | não |  |  |  |
| 3 | `company_id` | `uuid` | não |  |  |  |
| 4 | `origem` | `text` | não |  |  |  |
| 5 | `origem_pedido_id` | `text` | não |  |  |  |
| 6 | `data_pedido` | `date` | não |  |  |  |
| 7 | `valor` | `numeric(14,2)` | sim |  |  |  |
| 8 | `vendedor_id` | `integer` | sim |  |  |  |
| 9 | `vendedor_credito_id` | `integer` | sim |  |  |  |
| 10 | `sdr_credito_id` | `integer` | sim |  |  |  |
| 11 | `raw` | `jsonb` | sim |  |  |  |
| 12 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| customer_purchases_company_id_fkey | FOREIGN KEY | `FOREIGN KEY (company_id) REFERENCES companies(id)` | NO ACTION | NO ACTION | sim |
| customer_purchases_customer_id_fkey | FOREIGN KEY | `FOREIGN KEY (customer_id) REFERENCES customers(id)` | NO ACTION | NO ACTION | sim |
| customer_purchases_origem_check | CHECK | `CHECK (origem = ANY (ARRAY['ERP'::text, 'MANUAL'::text]))` |  |  | sim |
| customer_purchases_origem_origem_pedido_id_key | UNIQUE | `UNIQUE (origem, origem_pedido_id)` |  |  | sim |
| customer_purchases_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| customer_purchases_sdr_credito_id_fkey | FOREIGN KEY | `FOREIGN KEY (sdr_credito_id) REFERENCES users(id)` | NO ACTION | NO ACTION | sim |
| customer_purchases_vendedor_credito_id_fkey | FOREIGN KEY | `FOREIGN KEY (vendedor_credito_id) REFERENCES users(id)` | NO ACTION | NO ACTION | sim |
| customer_purchases_vendedor_id_fkey | FOREIGN KEY | `FOREIGN KEY (vendedor_id) REFERENCES users(id)` | NO ACTION | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| customer_purchases_origem_origem_pedido_id_key | btree | origem, origem_pedido_id | sim | sim |  | `CREATE UNIQUE INDEX customer_purchases_origem_origem_pedido_id_key ON public.customer_purchases USING btree (origem, origem_pedido_id)` |
| customer_purchases_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX customer_purchases_pkey ON public.customer_purchases USING btree (id)` |
| idx_customer_purchases_customer_data | btree | customer_id, data_pedido | não | sim |  | `CREATE INDEX idx_customer_purchases_customer_data ON public.customer_purchases USING btree (customer_id, data_pedido DESC)` |


## Policies (RLS)

### `admin_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role)` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| trg_customer_purchases_after_insert | AFTER | INSERT | ROW | enabled | public.trg_after_purchase |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
