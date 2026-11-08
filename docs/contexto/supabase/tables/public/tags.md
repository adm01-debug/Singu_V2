# public.tags

> Tags/etiquetas para categorização

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
| 1 | `id` | `uuid` | não | `uuid_generate_v4()` |  |  |
| 2 | `nome` | `character varying(50)` | não |  |  |  |
| 3 | `descricao` | `character varying(255)` | sim |  |  |  |
| 4 | `cor` | `character varying(7)` | sim |  |  |  |
| 5 | `categoria` | `character varying(50)` | sim |  |  |  |
| 6 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| tags_nome_key | UNIQUE | `UNIQUE (nome)` |  |  | sim |
| tags_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| _dormant.company_tags | company_tags_tag_id_fkey | tag_id | CASCADE |
| _dormant.contact_tags | contact_tags_tag_id_fkey | tag_id | CASCADE |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| tags_nome_key | btree | nome | sim | sim |  | `CREATE UNIQUE INDEX tags_nome_key ON public.tags USING btree (nome)` |
| tags_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX tags_pkey ON public.tags USING btree (id)` |


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
