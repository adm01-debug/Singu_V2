# public.grupos_economicos

> Grupos econômicos (Sicoob, Sicredi, Cresol, etc)

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
| usada por views | public.vw_companies_completo, public.vw_companies_stats, public.vw_contacts_completo, public.vw_contacts_full, public.vw_cooperativas_estrutura, public.vw_empresas_hierarquia, public.vw_grupos_economicos_resumo, public.vw_matriz_filiais |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `nome` | `text` | não |  |  |  |
| 3 | `codigo` | `text` | sim |  |  |  |
| 4 | `tipo` | `text` | sim |  |  |  |
| 5 | `bitrix_enum_id` | `integer` | sim |  |  |  |
| 6 | `descricao` | `text` | sim |  |  |  |
| 7 | `website` | `text` | sim |  |  |  |
| 8 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 9 | `updated_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| grupos_economicos_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| grupos_economicos_tipo_check | CHECK | `CHECK (tipo = ANY (ARRAY['HOLDING'::text, 'COOPERATIVA_CREDITO'::text, 'COOPERATIVA_AGRO'::text, 'REDE_FRANQUIAS'::text, 'GRUPO_FAMILIAR'::text, 'GRUPO_EMPRESARIAL'::text, 'MATRIZ_FILIAIS'::text]))` |  |  | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.companies | companies_grupo_economico_id_fkey | grupo_economico_id | NO ACTION |
| public.coop_sistemas | coop_sistemas_grupo_economico_id_fkey | grupo_economico_id | NO ACTION |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| grupos_economicos_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX grupos_economicos_pkey ON public.grupos_economicos USING btree (id)` |
| idx_grupo_nome | btree | nome | sim | sim |  | `CREATE UNIQUE INDEX idx_grupo_nome ON public.grupos_economicos USING btree (nome)` |


## Policies (RLS)

### `grupos_economicos_all`

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
| set_updated_at | BEFORE | UPDATE | ROW | enabled | public.set_updated_at |


## Grants

_nenhum_
