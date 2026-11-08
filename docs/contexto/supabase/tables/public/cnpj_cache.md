# public.cnpj_cache

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
| 2 | `cnpj` | `text` | não |  |  |  |
| 3 | `razao_social` | `text` | sim |  |  |  |
| 4 | `nome_fantasia` | `text` | sim |  |  |  |
| 5 | `logradouro` | `text` | sim |  |  |  |
| 6 | `numero` | `text` | sim |  |  |  |
| 7 | `complemento` | `text` | sim |  |  |  |
| 8 | `bairro` | `text` | sim |  |  |  |
| 9 | `municipio` | `text` | sim |  |  |  |
| 10 | `uf` | `text` | sim |  |  |  |
| 11 | `cep` | `text` | sim |  |  |  |
| 12 | `telefone` | `text` | sim |  |  |  |
| 13 | `email` | `text` | sim |  |  |  |
| 14 | `cnae_principal` | `text` | sim |  |  |  |
| 15 | `cnae_descricao` | `text` | sim |  |  |  |
| 16 | `situacao` | `text` | sim |  |  |  |
| 17 | `data_abertura` | `date` | sim |  |  |  |
| 18 | `capital_social` | `numeric` | sim |  |  |  |
| 19 | `porte` | `text` | sim |  |  |  |
| 20 | `natureza_juridica` | `text` | sim |  |  |  |
| 21 | `consulted_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 22 | `raw_data` | `jsonb` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| cnpj_cache_cnpj_key | UNIQUE | `UNIQUE (cnpj)` |  |  | sim |
| cnpj_cache_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| cnpj_cache_cnpj_key | btree | cnpj | sim | sim |  | `CREATE UNIQUE INDEX cnpj_cache_cnpj_key ON public.cnpj_cache USING btree (cnpj)` |
| cnpj_cache_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX cnpj_cache_pkey ON public.cnpj_cache USING btree (id)` |


## Policies (RLS)

### `Authenticated read`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

_nenhum_
