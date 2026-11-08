# _dormant.deal_products_catalog

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
| 2 | `codigo` | `character varying(50)` | sim |  |  |  |
| 3 | `nome` | `character varying(255)` | não |  |  |  |
| 4 | `descricao` | `text` | sim |  |  |  |
| 5 | `categoria` | `character varying(100)` | sim |  |  |  |
| 6 | `preco_unitario` | `numeric(15,2)` | sim |  |  |  |
| 7 | `unidade` | `character varying(20)` | sim | `'un'::character varying` |  |  |
| 8 | `is_active` | `boolean` | sim | `true` |  |  |
| 9 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 10 | `updated_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| deal_products_catalog_codigo_key | UNIQUE | `UNIQUE (codigo)` |  |  | sim |
| deal_products_catalog_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| _dormant.deal_products | deal_products_product_id_fkey | product_id | NO ACTION |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| deal_products_catalog_codigo_key | btree | codigo | sim | sim |  | `CREATE UNIQUE INDEX deal_products_catalog_codigo_key ON _dormant.deal_products_catalog USING btree (codigo)` |
| deal_products_catalog_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX deal_products_catalog_pkey ON _dormant.deal_products_catalog USING btree (id)` |


## Policies (RLS)

> ⚠️ RLS **desabilitado** nesta tabela.



## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| anon | SELECT |
| authenticated | SELECT |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
