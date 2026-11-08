# public.carrier_homologations

> Histórico de homologação de transportadoras. Homologador: Logística (Thiago id=80). Status via enum carrier_homologation_status.

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

### `carrier_homologations_delete`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |
| WITH CHECK |  |

### `carrier_homologations_insert`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |

### `carrier_homologations_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |
| WITH CHECK |  |

### `carrier_homologations_update`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| set_updated_at | BEFORE | UPDATE | ROW | enabled | public.set_updated_at |
| trg_carrier_homologation_insert_update_flag | BEFORE | INSERT | ROW | enabled | public.trg_fn_carrier_update_homologado_flag |
| trg_carrier_homologation_update_update_flag | BEFORE | UPDATE | ROW | enabled | public.trg_fn_carrier_update_homologado_flag |
| trg_carrier_homologations_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

_nenhum_
