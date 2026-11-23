# public.carrier_score_history

> Histórico de evolução do score de transportadoras. Append-only, 1 registro por recálculo.

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

### `carrier_score_history_owner_or_admin_mfa`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `((EXISTS ( SELECT 1    FROM (carriers ca      JOIN companies c ON ((c.id = ca.company_id)))   WHERE ((ca.id = carrier_score_history.carrier_id) AND (c.deleted_at IS NULL) AND (c.user_id = ( SELECT auth.uid() AS uid))))) OR (( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role) AND (( SELECT (auth.jwt() ->> 'aal'::text)) = 'aal2'::text)))` |
| WITH CHECK | `((EXISTS ( SELECT 1    FROM (carriers ca      JOIN companies c ON ((c.id = ca.company_id)))   WHERE ((ca.id = carrier_score_history.carrier_id) AND (c.deleted_at IS NULL) AND (c.user_id = ( SELECT auth.uid() AS uid))))) OR (( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role) AND (( SELECT (auth.jwt() ->> 'aal'::text)) = 'aal2'::text)))` |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
