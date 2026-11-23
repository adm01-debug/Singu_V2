# public.supplier_homologations

> Homologação de fornecedores pelo Depto de Compras. Cada registro = uma solicitação/decisão. Histórico completo mantido.

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
| usada por views | public.vw_supplier_homologation_control, public.vw_supplier_homologation_queue, public.vw_supplier_qualification_dashboard |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `supplier_id` | `uuid` | não |  |  |  |
| 3 | `status` | `supplier_homologation_status` | não | `'pendente'::supplier_homologation_status` |  |  |
| 4 | `avaliador_id` | `integer` | sim |  |  |  |
| 5 | `data_solicitacao` | `timestamp with time zone` | não | `now()` |  |  |
| 6 | `data_decisao` | `timestamp with time zone` | sim |  |  |  |
| 7 | `validade` | `date` | sim |  |  | Data de expiração. Preenchida automaticamente via config HOMOLOGACAO_VALIDADE_DIAS se não informada. |
| 8 | `criterios_checados` | `jsonb` | sim | `'{}'::jsonb` |  | JSONB com checklist: cnpj_valido, documentacao_fiscal, referencias_checadas, capacidade_produtiva, visita_tecnica, etc. |
| 9 | `motivo_reprovacao` | `text` | sim |  |  |  |
| 10 | `observacoes` | `text` | sim |  |  |  |
| 11 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 12 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| supplier_homologations_avaliador_id_fkey | FOREIGN KEY | `FOREIGN KEY (avaliador_id) REFERENCES users(id)` | NO ACTION | NO ACTION | sim |
| supplier_homologations_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| supplier_homologations_supplier_id_fkey | FOREIGN KEY | `FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_supplier_homologations_avaliador_id | btree | avaliador_id | não | sim |  | `CREATE INDEX idx_supplier_homologations_avaliador_id ON public.supplier_homologations USING btree (avaliador_id)` |
| idx_supplier_homologations_status | btree | status | não | sim |  | `CREATE INDEX idx_supplier_homologations_status ON public.supplier_homologations USING btree (status)` |
| idx_supplier_homologations_supplier | btree | supplier_id | não | sim |  | `CREATE INDEX idx_supplier_homologations_supplier ON public.supplier_homologations USING btree (supplier_id)` |
| idx_supplier_homologations_supplier_created | btree | supplier_id, created_at | não | sim |  | `CREATE INDEX idx_supplier_homologations_supplier_created ON public.supplier_homologations USING btree (supplier_id, created_at DESC)` |
| supplier_homologations_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX supplier_homologations_pkey ON public.supplier_homologations USING btree (id)` |


## Policies (RLS)

### `supplier_homologations_owner_or_admin_mfa`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `((EXISTS ( SELECT 1    FROM (suppliers s      JOIN companies c ON ((c.id = s.company_id)))   WHERE ((s.id = supplier_homologations.supplier_id) AND (c.deleted_at IS NULL) AND (c.user_id = ( SELECT auth.uid() AS uid))))) OR (( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role) AND (( SELECT (auth.jwt() ->> 'aal'::text)) = 'aal2'::text)))` |
| WITH CHECK | `((EXISTS ( SELECT 1    FROM (suppliers s      JOIN companies c ON ((c.id = s.company_id)))   WHERE ((s.id = supplier_homologations.supplier_id) AND (c.deleted_at IS NULL) AND (c.user_id = ( SELECT auth.uid() AS uid))))) OR (( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role) AND (( SELECT (auth.jwt() ->> 'aal'::text)) = 'aal2'::text)))` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| set_updated_at | BEFORE | UPDATE | ROW | enabled | public.set_updated_at |
| trg_homologation_insert_update_flag | BEFORE | INSERT | ROW | enabled | public.trg_fn_update_homologado_flag |
| trg_homologation_update_update_flag | BEFORE | UPDATE | ROW | enabled | public.trg_fn_update_homologado_flag |
| trg_supplier_homologations_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
