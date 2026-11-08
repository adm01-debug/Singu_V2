# public.loss_reasons

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
| usada por views | public.vw_deals_full |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `nome` | `character varying(100)` | não |  |  |  |
| 3 | `descricao` | `text` | sim |  |  |  |
| 4 | `categoria` | `character varying(50)` | sim |  |  |  |
| 5 | `is_active` | `boolean` | sim | `true` |  |  |
| 6 | `requer_detalhes` | `boolean` | sim | `false` |  |  |
| 7 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| loss_reasons_nome_key | UNIQUE | `UNIQUE (nome)` |  |  | sim |
| loss_reasons_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| _dormant.deals | deals_loss_reason_id_fkey | loss_reason_id | NO ACTION |
| public.deals | deals_loss_reason_id_fkey | loss_reason_id | NO ACTION |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| loss_reasons_nome_key | btree | nome | sim | sim |  | `CREATE UNIQUE INDEX loss_reasons_nome_key ON public.loss_reasons USING btree (nome)` |
| loss_reasons_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX loss_reasons_pkey ON public.loss_reasons USING btree (id)` |


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
