# public.lead_sources

> Catálogo de origens de leads utilizado por entidades comerciais que guardam source_id. Mantém nome, categoria, descrição, custo por lead e estado ativo. PK: id; nome é UNIQUE.

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
| usada por views | public.vw_deals_full, public.vw_leads_full |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  | Identificador UUID da origem e chave primária; gerado por gen_random_uuid(). |
| 2 | `nome` | `character varying(100)` | não |  |  | Nome único de exibição da origem do lead. |
| 3 | `descricao` | `text` | sim |  |  | Descrição opcional da origem. |
| 4 | `categoria` | `character varying(50)` | sim |  |  | Categoria textual da origem; domínio não definido no schema. |
| 5 | `custo_por_lead` | `numeric(10,2)` | sim |  |  | Custo numérico atribuído a cada lead desta origem; moeda/unidade não definidas no schema. |
| 6 | `is_active` | `boolean` | sim | `true` |  | Indica se a origem pode ser selecionada/considerada ativa; DEFAULT true. |
| 7 | `created_at` | `timestamp with time zone` | sim | `now()` |  | Data e hora de criação da origem; timestamptz, DEFAULT now(). |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| lead_sources_nome_key | UNIQUE | `UNIQUE (nome)` |  |  | sim |
| lead_sources_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| _dormant.deals | deals_source_id_fkey | source_id | NO ACTION |
| public.leads | leads_source_id_fkey | source_id | NO ACTION |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| lead_sources_nome_key | btree | nome | sim | sim |  | `CREATE UNIQUE INDEX lead_sources_nome_key ON public.lead_sources USING btree (nome)` |
| lead_sources_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX lead_sources_pkey ON public.lead_sources USING btree (id)` |


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
