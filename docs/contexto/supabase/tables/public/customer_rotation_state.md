# public.customer_rotation_state

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
| usada por views | public.vw_rodizio_bloqueios, public.vw_rodizio_carga_closers, public.vw_rodizio_carga_sdrs, public.vw_rodizio_kpis |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `customer_id` | `uuid` | não |  |  |  |
| 2 | `segmento` | `text` | não | `'NAO_ATIVADO'::text` |  |  |
| 3 | `ciclo_closer` | `integer` | não | `1` |  |  |
| 4 | `closers_visitados` | `integer[]` | não | `'{}'::integer[]` |  |  |
| 5 | `ciclo_sdr` | `integer` | não | `1` |  |  |
| 6 | `sdrs_visitados` | `integer[]` | não | `'{}'::integer[]` |  |  |
| 7 | `proxima_rotacao_closer` | `date` | sim |  |  |  |
| 8 | `proxima_rotacao_sdr` | `date` | sim |  |  |  |
| 9 | `bloqueado_ate` | `date` | sim |  |  |  |
| 10 | `bloqueio_motivo` | `text` | sim |  |  |  |
| 11 | `bloqueado_por_id` | `integer` | sim |  |  |  |
| 12 | `bloqueio_aprovado_por_id` | `integer` | sim |  |  |  |
| 13 | `sla_contato_vencido` | `boolean` | não | `false` |  |  |
| 14 | `pool_frio` | `boolean` | não | `false` |  |  |
| 15 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| customer_rotation_state_bloqueado_por_id_fkey | FOREIGN KEY | `FOREIGN KEY (bloqueado_por_id) REFERENCES users(id)` | NO ACTION | NO ACTION | sim |
| customer_rotation_state_bloqueio_aprovado_por_id_fkey | FOREIGN KEY | `FOREIGN KEY (bloqueio_aprovado_por_id) REFERENCES users(id)` | NO ACTION | NO ACTION | sim |
| customer_rotation_state_customer_id_fkey | FOREIGN KEY | `FOREIGN KEY (customer_id) REFERENCES customers(id)` | NO ACTION | NO ACTION | sim |
| customer_rotation_state_pkey | PRIMARY KEY | `PRIMARY KEY (customer_id)` |  |  | sim |
| customer_rotation_state_segmento_check | CHECK | `CHECK (segmento = ANY (ARRAY['ATIVO'::text, 'INATIVO'::text, 'NAO_ATIVADO'::text, 'BLOQUEADO'::text, 'POOL_FRIO'::text, 'FORA_RODIZIO'::text]))` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| customer_rotation_state_pkey | btree | customer_id | sim | sim |  | `CREATE UNIQUE INDEX customer_rotation_state_pkey ON public.customer_rotation_state USING btree (customer_id)` |
| idx_rotation_state_segmento_closer | btree | segmento, proxima_rotacao_closer | não | sim |  | `CREATE INDEX idx_rotation_state_segmento_closer ON public.customer_rotation_state USING btree (segmento, proxima_rotacao_closer)` |
| idx_rotation_state_segmento_sdr | btree | segmento, proxima_rotacao_sdr | não | sim |  | `CREATE INDEX idx_rotation_state_segmento_sdr ON public.customer_rotation_state USING btree (segmento, proxima_rotacao_sdr)` |


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

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
