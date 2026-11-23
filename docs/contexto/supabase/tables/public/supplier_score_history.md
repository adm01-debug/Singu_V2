# public.supplier_score_history

> Histórico de evolução do score. Cada recálculo gera 1 registro. Permite rastrear tendências ao longo do tempo.

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
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `supplier_id` | `uuid` | não |  |  |  |
| 3 | `score_preco` | `numeric(5,2)` | sim |  |  |  |
| 4 | `score_prazo` | `numeric(5,2)` | sim |  |  |  |
| 5 | `score_qualidade` | `numeric(5,2)` | sim |  |  |  |
| 6 | `score_entrega` | `numeric(5,2)` | sim |  |  |  |
| 7 | `score_geral` | `numeric(5,2)` | sim |  |  |  |
| 8 | `previous_score` | `numeric(5,2)` | sim |  |  |  |
| 9 | `score_change` | `numeric(5,2)` | sim |  |  |  |
| 10 | `segment_code` | `text` | sim |  |  |  |
| 11 | `previous_segment` | `text` | sim |  |  |  |
| 12 | `segment_changed` | `boolean` | sim | `false` |  |  |
| 13 | `trend` | `text` | sim |  |  |  |
| 14 | `change_reason` | `text` | sim |  |  |  |
| 15 | `measured_at` | `timestamp with time zone` | não | `now()` |  |  |
| 16 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| supplier_score_history_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| supplier_score_history_supplier_id_fkey | FOREIGN KEY | `FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_supplier_score_history_supplier | btree | supplier_id, measured_at | não | sim |  | `CREATE INDEX idx_supplier_score_history_supplier ON public.supplier_score_history USING btree (supplier_id, measured_at DESC)` |
| idx_supplier_score_history_supplier_id | btree | supplier_id | não | sim |  | `CREATE INDEX idx_supplier_score_history_supplier_id ON public.supplier_score_history USING btree (supplier_id)` |
| supplier_score_history_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX supplier_score_history_pkey ON public.supplier_score_history USING btree (id)` |


## Policies (RLS)

### `supplier_score_history_owner_or_admin_mfa_insert`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `((EXISTS ( SELECT 1    FROM (suppliers s      JOIN companies c ON ((c.id = s.company_id)))   WHERE ((s.id = supplier_score_history.supplier_id) AND (c.deleted_at IS NULL) AND (c.user_id = ( SELECT auth.uid() AS uid))))) OR (( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role) AND (( SELECT (auth.jwt() ->> 'aal'::text)) = 'aal2'::text)))` |

### `supplier_score_history_owner_or_admin_mfa_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `((EXISTS ( SELECT 1    FROM (suppliers s      JOIN companies c ON ((c.id = s.company_id)))   WHERE ((s.id = supplier_score_history.supplier_id) AND (c.deleted_at IS NULL) AND (c.user_id = ( SELECT auth.uid() AS uid))))) OR (( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role) AND (( SELECT (auth.jwt() ->> 'aal'::text)) = 'aal2'::text)))` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
