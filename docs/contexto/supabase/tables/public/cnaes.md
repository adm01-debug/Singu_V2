# public.cnaes

> Catálogo oficial de CNAEs da Receita Federal. Fonte de verdade para códigos e descrições.

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
| 1 | `codigo` | `character varying(7)` | não |  |  |  |
| 2 | `descricao` | `text` | não |  |  |  |
| 3 | `secao` | `character(1)` | sim |  |  |  |
| 4 | `divisao` | `character varying(2)` | sim |  |  |  |
| 5 | `grupo` | `character varying(3)` | sim |  |  |  |
| 6 | `classe` | `character varying(5)` | sim |  |  |  |
| 7 | `subclasse` | `character varying(7)` | sim |  |  |  |
| 8 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| cnaes_pkey | PRIMARY KEY | `PRIMARY KEY (codigo)` |  |  | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.company_cnaes | company_cnaes_cnae_codigo_fkey | cnae_codigo | NO ACTION |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| cnaes_pkey | btree | codigo | sim | sim |  | `CREATE UNIQUE INDEX cnaes_pkey ON public.cnaes USING btree (codigo)` |


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
