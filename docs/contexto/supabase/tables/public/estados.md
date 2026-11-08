# public.estados

> Catálogo oficial de estados brasileiros. Fonte: IBGE.

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 2 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `ibge_code` | `integer` | não |  |  |  |
| 2 | `uf` | `character(2)` | não |  |  |  |
| 3 | `nome` | `character varying(50)` | não |  |  |  |
| 4 | `regiao_sigla` | `character(2)` | sim |  |  |  |
| 5 | `regiao_nome` | `character varying(20)` | sim |  |  |  |
| 6 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| estados_pkey | PRIMARY KEY | `PRIMARY KEY (ibge_code)` |  |  | sim |
| estados_uf_key | UNIQUE | `UNIQUE (uf)` |  |  | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.cidades | cidades_estado_ibge_fkey | estado_ibge | NO ACTION |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| estados_pkey | btree | ibge_code | sim | sim |  | `CREATE UNIQUE INDEX estados_pkey ON public.estados USING btree (ibge_code)` |
| estados_uf_key | btree | uf | sim | sim |  | `CREATE UNIQUE INDEX estados_uf_key ON public.estados USING btree (uf)` |


## Policies (RLS)

### `read_only_auth`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |
| WITH CHECK |  |

### `service_full`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | service_role |
| USING | `true` |
| WITH CHECK | `true` |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
