# public.rodizio_distribuicao_staging

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 4 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `onda` | `integer` | não |  |  |  |
| 3 | `customer_id` | `uuid` | não |  |  |  |
| 4 | `closer_destino_id` | `integer` | sim |  |  |  |
| 5 | `sdr_destino_id` | `integer` | sim |  |  |  |
| 6 | `origem` | `text` | não |  |  |  |
| 7 | `status` | `text` | não | `'RASCUNHO'::text` |  |  |
| 8 | `criado_por_id` | `integer` | sim |  |  |  |
| 9 | `aprovado_por_id` | `integer` | sim |  |  |  |
| 10 | `aplicado_em` | `timestamp with time zone` | sim |  |  |  |
| 11 | `execucao_id` | `uuid` | sim |  |  |  |
| 12 | `observacoes` | `text` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| rodizio_distribuicao_staging_aprovado_por_id_fkey | FOREIGN KEY | `FOREIGN KEY (aprovado_por_id) REFERENCES users(id)` | NO ACTION | NO ACTION | sim |
| rodizio_distribuicao_staging_closer_destino_id_fkey | FOREIGN KEY | `FOREIGN KEY (closer_destino_id) REFERENCES users(id)` | NO ACTION | NO ACTION | sim |
| rodizio_distribuicao_staging_criado_por_id_fkey | FOREIGN KEY | `FOREIGN KEY (criado_por_id) REFERENCES users(id)` | NO ACTION | NO ACTION | sim |
| rodizio_distribuicao_staging_customer_id_fkey | FOREIGN KEY | `FOREIGN KEY (customer_id) REFERENCES customers(id)` | NO ACTION | NO ACTION | sim |
| rodizio_distribuicao_staging_execucao_id_fkey | FOREIGN KEY | `FOREIGN KEY (execucao_id) REFERENCES rodizio_execucoes(id)` | NO ACTION | NO ACTION | sim |
| rodizio_distribuicao_staging_onda_customer_id_key | UNIQUE | `UNIQUE (onda, customer_id)` |  |  | sim |
| rodizio_distribuicao_staging_origem_check | CHECK | `CHECK (origem = ANY (ARRAY['MANUAL'::text, 'SUGESTAO_MOTOR'::text, 'IMPORT_CSV'::text]))` |  |  | sim |
| rodizio_distribuicao_staging_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| rodizio_distribuicao_staging_sdr_destino_id_fkey | FOREIGN KEY | `FOREIGN KEY (sdr_destino_id) REFERENCES users(id)` | NO ACTION | NO ACTION | sim |
| rodizio_distribuicao_staging_status_check | CHECK | `CHECK (status = ANY (ARRAY['RASCUNHO'::text, 'APROVADO'::text, 'APLICADO'::text, 'REJEITADO'::text]))` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| rodizio_distribuicao_staging_onda_customer_id_key | btree | onda, customer_id | sim | sim |  | `CREATE UNIQUE INDEX rodizio_distribuicao_staging_onda_customer_id_key ON public.rodizio_distribuicao_staging USING btree (onda, customer_id)` |
| rodizio_distribuicao_staging_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX rodizio_distribuicao_staging_pkey ON public.rodizio_distribuicao_staging USING btree (id)` |


## Policies (RLS)

### `admin_delete`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role)` |
| WITH CHECK |  |

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

_nenhum_
