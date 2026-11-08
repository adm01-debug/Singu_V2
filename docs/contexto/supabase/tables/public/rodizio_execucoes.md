# public.rodizio_execucoes

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 3 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |
| usada por views | public.vw_rodizio_execucoes |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `tipo` | `text` | não |  |  |  |
| 3 | `modo` | `text` | não |  |  |  |
| 4 | `iniciado_em` | `timestamp with time zone` | não | `now()` |  |  |
| 5 | `finalizado_em` | `timestamp with time zone` | sim |  |  |  |
| 6 | `parametros` | `jsonb` | sim |  |  |  |
| 7 | `total_elegiveis` | `integer` | sim |  |  |  |
| 8 | `total_rotacionados` | `integer` | sim |  |  |  |
| 9 | `distribuicao` | `jsonb` | sim |  |  |  |
| 10 | `erros` | `jsonb` | sim |  |  |  |
| 11 | `executado_por_id` | `integer` | sim |  |  |  |
| 12 | `revertida_por_execucao_id` | `uuid` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| rodizio_execucoes_executado_por_id_fkey | FOREIGN KEY | `FOREIGN KEY (executado_por_id) REFERENCES users(id)` | NO ACTION | NO ACTION | sim |
| rodizio_execucoes_modo_check | CHECK | `CHECK (modo = ANY (ARRAY['DRY_RUN'::text, 'REAL'::text, 'ROLLBACK'::text]))` |  |  | sim |
| rodizio_execucoes_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| rodizio_execucoes_revertida_por_execucao_id_fkey | FOREIGN KEY | `FOREIGN KEY (revertida_por_execucao_id) REFERENCES rodizio_execucoes(id)` | NO ACTION | NO ACTION | sim |
| rodizio_execucoes_tipo_check | CHECK | `CHECK (tipo = ANY (ARRAY['CLOSER'::text, 'SDR'::text, 'SEGMENTAR'::text, 'DISTRIBUICAO_INICIAL'::text]))` |  |  | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.customer_ownership_history | customer_ownership_history_execucao_id_fkey | execucao_id | NO ACTION |
| public.customer_sdr_history | customer_sdr_history_execucao_id_fkey | execucao_id | NO ACTION |
| public.rodizio_distribuicao_staging | rodizio_distribuicao_staging_execucao_id_fkey | execucao_id | NO ACTION |
| public.rodizio_execucoes | rodizio_execucoes_revertida_por_execucao_id_fkey | revertida_por_execucao_id | NO ACTION |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| rodizio_execucoes_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX rodizio_execucoes_pkey ON public.rodizio_execucoes USING btree (id)` |


## Policies (RLS)

### `admin_insert`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role)` |

### `admin_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role)` |
| WITH CHECK |  |

### `admin_update`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role)` |
| WITH CHECK | `( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role)` |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
