# public.products

> Catálogo de produtos/serviços comercializados. Contém SKU, preço, custo, estoque e metadados. PK: id; SKU é opcional e UNIQUE. Relaciona-se a itens de oportunidade por public.deal_items.product_id e a novidades por public.product_novelties.product_id.

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
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  | Identificador UUID do produto e chave primária; gerado por gen_random_uuid(). |
| 2 | `sku` | `text` | sim |  |  | Código de estoque/SKU do produto; texto opcional e único quando preenchido. |
| 3 | `name` | `text` | não |  |  | Nome do produto; obrigatório. |
| 4 | `description` | `text` | sim |  |  | Descrição textual opcional do produto. |
| 5 | `category` | `text` | sim |  |  | Categoria textual do produto; sem domínio fechado declarado. |
| 6 | `unit_price` | `numeric(15,2)` | sim | `0` |  | Preço unitário numérico; DEFAULT 0. Moeda não está definida no schema. |
| 7 | `cost_price` | `numeric(15,2)` | sim | `0` |  | Custo unitário numérico; DEFAULT 0. Moeda não está definida no schema. |
| 8 | `margin_pct` | `numeric(5,2)` | sim | ` CASE     WHEN (unit_price > (0)::numeric) THEN (((unit_price - cost_price) / unit_price) * (100)::numeric)     ELSE (0)::numeric END` | s | Percentual de margem gerado: ((unit_price - cost_price) / unit_price) * 100; retorna 0 quando unit_price não é positivo. Não editar como campo independente. |
| 9 | `stock_qty` | `integer` | sim | `0` |  | Quantidade atual em estoque, em unidades do produto; DEFAULT 0. |
| 10 | `min_stock` | `integer` | sim | `0` |  | Limite mínimo de estoque configurado, em unidades do produto; DEFAULT 0. |
| 11 | `is_active` | `boolean` | sim | `true` |  | Indica se o produto está ativo para uso comercial; DEFAULT true. |
| 12 | `metadata` | `jsonb` | sim | `'{}'::jsonb` |  | Atributos complementares do produto em JSONB; DEFAULT objeto vazio, sem chaves padronizadas no schema. |
| 13 | `created_at` | `timestamp with time zone` | sim | `now()` |  | Data e hora de criação do produto; timestamptz, DEFAULT now(). |
| 14 | `updated_at` | `timestamp with time zone` | sim | `now()` |  | Data e hora da última atualização registrada; timestamptz, DEFAULT now(). |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| products_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| products_sku_key | UNIQUE | `UNIQUE (sku)` |  |  | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.deal_items | deal_items_product_id_fkey | product_id | NO ACTION |
| public.product_novelties | product_novelties_product_id_fkey | product_id | CASCADE |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| products_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX products_pkey ON public.products USING btree (id)` |
| products_sku_key | btree | sku | sim | sim |  | `CREATE UNIQUE INDEX products_sku_key ON public.products USING btree (sku)` |


## Policies (RLS)

### `products_all`

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
| trg_products_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
