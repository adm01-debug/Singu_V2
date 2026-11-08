# public.cidades

> Catálogo oficial de municípios brasileiros. Fonte: IBGE. Lat/lon para dashboards geográficos.

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
| 2 | `nome` | `character varying(120)` | não |  |  |  |
| 3 | `estado_ibge` | `integer` | não |  |  |  |
| 4 | `uf` | `character(2)` | não |  |  |  |
| 5 | `mesorregiao` | `character varying(100)` | sim |  |  |  |
| 6 | `microrregiao` | `character varying(100)` | sim |  |  |  |
| 7 | `regiao_imediata` | `character varying(100)` | sim |  |  |  |
| 8 | `regiao_intermediaria` | `character varying(100)` | sim |  |  |  |
| 9 | `latitude` | `numeric(10,7)` | sim |  |  |  |
| 10 | `longitude` | `numeric(10,7)` | sim |  |  |  |
| 11 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| cidades_estado_ibge_fkey | FOREIGN KEY | `FOREIGN KEY (estado_ibge) REFERENCES estados(ibge_code)` | NO ACTION | NO ACTION | sim |
| cidades_pkey | PRIMARY KEY | `PRIMARY KEY (ibge_code)` |  |  | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.company_addresses | company_addresses_cidade_ibge_fkey | cidade_ibge | NO ACTION |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| cidades_pkey | btree | ibge_code | sim | sim |  | `CREATE UNIQUE INDEX cidades_pkey ON public.cidades USING btree (ibge_code)` |
| idx_cidades_estado_ibge | btree | estado_ibge | não | sim |  | `CREATE INDEX idx_cidades_estado_ibge ON public.cidades USING btree (estado_ibge)` |
| idx_cidades_uf | btree | uf | não | sim |  | `CREATE INDEX idx_cidades_uf ON public.cidades USING btree (uf)` |


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
