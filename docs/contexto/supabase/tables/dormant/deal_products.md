# _dormant.deal_products

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | não |
| RLS forçado (owner) | não |
| policies | 0 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `deal_id` | `uuid` | não |  |  |  |
| 3 | `product_id` | `uuid` | sim |  |  |  |
| 4 | `nome_produto` | `character varying(255)` | não |  |  |  |
| 5 | `descricao` | `text` | sim |  |  |  |
| 6 | `quantidade` | `numeric(15,4)` | sim | `1` |  |  |
| 7 | `unidade` | `character varying(20)` | sim | `'un'::character varying` |  |  |
| 8 | `preco_unitario` | `numeric(15,2)` | não |  |  |  |
| 9 | `desconto_percentual` | `numeric(5,2)` | sim | `0` |  |  |
| 10 | `valor_total` | `numeric(15,2)` | sim |  |  |  |
| 11 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| deal_products_deal_id_fkey | FOREIGN KEY | `FOREIGN KEY (deal_id) REFERENCES _dormant.deals(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| deal_products_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| deal_products_product_id_fkey | FOREIGN KEY | `FOREIGN KEY (product_id) REFERENCES deal_products_catalog(id)` | NO ACTION | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| deal_products_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX deal_products_pkey ON _dormant.deal_products USING btree (id)` |


## Policies (RLS)

> ⚠️ RLS **desabilitado** nesta tabela.



## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| tr_deal_product_valor | BEFORE | INSERT OR UPDATE | ROW | enabled | public.calcular_valor_produto |


## Grants

_nenhum_
