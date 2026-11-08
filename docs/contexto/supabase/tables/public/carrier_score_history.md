# public.carrier_score_history

> Histórico de evolução do score de transportadoras. Append-only, 1 registro por recálculo.

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
| 2 | `carrier_id` | `uuid` | não |  |  |  |
| 3 | `score_pontualidade` | `numeric(5,2)` | sim |  |  |  |
| 4 | `score_conservacao` | `numeric(5,2)` | sim |  |  |  |
| 5 | `score_preco_frete` | `numeric(5,2)` | sim |  |  |  |
| 6 | `score_rastreamento` | `numeric(5,2)` | sim |  |  |  |
| 7 | `score_cobertura` | `numeric(5,2)` | sim |  |  |  |
| 8 | `score_geral` | `numeric(5,2)` | sim |  |  |  |
| 9 | `previous_score` | `numeric(5,2)` | sim |  |  |  |
| 10 | `score_change` | `numeric(5,2)` | sim |  |  |  |
| 11 | `segment_code` | `text` | sim |  |  |  |
| 12 | `previous_segment` | `text` | sim |  |  |  |
| 13 | `segment_changed` | `boolean` | sim | `false` |  |  |
| 14 | `trend` | `text` | sim |  |  |  |
| 15 | `change_reason` | `text` | sim |  |  |  |
| 16 | `measured_at` | `timestamp with time zone` | não | `now()` |  |  |
| 17 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| carrier_score_history_carrier_id_fkey | FOREIGN KEY | `FOREIGN KEY (carrier_id) REFERENCES carriers(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| carrier_score_history_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| carrier_score_history_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX carrier_score_history_pkey ON public.carrier_score_history USING btree (id)` |
| idx_carrier_score_history_carrier | btree | carrier_id, measured_at | não | sim |  | `CREATE INDEX idx_carrier_score_history_carrier ON public.carrier_score_history USING btree (carrier_id, measured_at DESC)` |
| idx_carrier_score_history_carrier_id | btree | carrier_id | não | sim |  | `CREATE INDEX idx_carrier_score_history_carrier_id ON public.carrier_score_history USING btree (carrier_id)` |


## Policies (RLS)

### `carrier_score_history_delete`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |
| WITH CHECK |  |

### `carrier_score_history_insert`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |

### `carrier_score_history_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |
| WITH CHECK |  |

### `carrier_score_history_update`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

_nenhum_
