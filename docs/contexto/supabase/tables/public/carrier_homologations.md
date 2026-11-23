# public.carrier_homologations

> Histórico de homologação de transportadoras. Homologador: Logística (Thiago id=80). Status via enum carrier_homologation_status.

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
| usada por views | public.vw_carrier_homologation_control, public.vw_carrier_homologation_queue, public.vw_carrier_qualification_dashboard, public.vw_carriers, public.vw_carriers_completo |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `carrier_id` | `uuid` | não |  |  |  |
| 3 | `status` | `carrier_homologation_status` | não | `'pendente'::carrier_homologation_status` |  |  |
| 4 | `avaliador_id` | `integer` | sim |  |  |  |
| 5 | `data_solicitacao` | `timestamp with time zone` | não | `now()` |  |  |
| 6 | `data_decisao` | `timestamp with time zone` | sim |  |  |  |
| 7 | `validade` | `date` | sim |  |  |  |
| 8 | `criterios_checados` | `jsonb` | sim | `'{}'::jsonb` |  |  |
| 9 | `motivo_reprovacao` | `text` | sim |  |  |  |
| 10 | `observacoes` | `text` | sim |  |  |  |
| 11 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 12 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| carrier_homologations_avaliador_id_fkey | FOREIGN KEY | `FOREIGN KEY (avaliador_id) REFERENCES users(id)` | NO ACTION | NO ACTION | sim |
| carrier_homologations_carrier_id_fkey | FOREIGN KEY | `FOREIGN KEY (carrier_id) REFERENCES carriers(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| carrier_homologations_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| carrier_homologations_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX carrier_homologations_pkey ON public.carrier_homologations USING btree (id)` |
| idx_carrier_homologations_avaliador_id | btree | avaliador_id | não | sim |  | `CREATE INDEX idx_carrier_homologations_avaliador_id ON public.carrier_homologations USING btree (avaliador_id)` |
| idx_carrier_homologations_carrier_created | btree | carrier_id, created_at | não | sim |  | `CREATE INDEX idx_carrier_homologations_carrier_created ON public.carrier_homologations USING btree (carrier_id, created_at DESC)` |
| idx_carrier_homologations_carrier_id | btree | carrier_id | não | sim |  | `CREATE INDEX idx_carrier_homologations_carrier_id ON public.carrier_homologations USING btree (carrier_id)` |
| idx_carrier_homologations_status | btree | status | não | sim |  | `CREATE INDEX idx_carrier_homologations_status ON public.carrier_homologations USING btree (status)` |


## Policies (RLS)

### `carrier_homologations_owner_or_admin_mfa`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `((EXISTS ( SELECT 1    FROM (carriers ca      JOIN companies c ON ((c.id = ca.company_id)))   WHERE ((ca.id = carrier_homologations.carrier_id) AND (c.deleted_at IS NULL) AND (c.user_id = ( SELECT auth.uid() AS uid))))) OR (( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role) AND (( SELECT (auth.jwt() ->> 'aal'::text)) = 'aal2'::text)))` |
| WITH CHECK | `((EXISTS ( SELECT 1    FROM (carriers ca      JOIN companies c ON ((c.id = ca.company_id)))   WHERE ((ca.id = carrier_homologations.carrier_id) AND (c.deleted_at IS NULL) AND (c.user_id = ( SELECT auth.uid() AS uid))))) OR (( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role) AND (( SELECT (auth.jwt() ->> 'aal'::text)) = 'aal2'::text)))` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| set_updated_at | BEFORE | UPDATE | ROW | enabled | public.set_updated_at |
| trg_carrier_homologation_insert_update_flag | BEFORE | INSERT | ROW | enabled | public.trg_fn_carrier_update_homologado_flag |
| trg_carrier_homologation_update_update_flag | BEFORE | UPDATE | ROW | enabled | public.trg_fn_carrier_update_homologado_flag |
| trg_carrier_homologations_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
