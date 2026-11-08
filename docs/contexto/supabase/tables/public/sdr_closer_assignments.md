# public.sdr_closer_assignments

> Histórico de vínculo SDR ↔ CLOSER

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
| usada por views | public.vw_dashboard_sdr, public.vw_historico_sdr_closer, public.vw_sdr_closer_atual, public.vw_sdr_qtd_closers |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `sdr_id` | `integer` | não |  |  |  |
| 3 | `closer_id` | `integer` | não |  |  |  |
| 4 | `data_inicio` | `date` | não |  |  |  |
| 5 | `data_fim` | `date` | sim |  |  |  |
| 6 | `criado_por_id` | `integer` | sim |  |  |  |
| 7 | `motivo_alteracao` | `text` | sim |  |  |  |
| 8 | `observacoes` | `text` | sim |  |  |  |
| 9 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 10 | `updated_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 11 | `sdr_nome` | `text` | sim |  |  |  |
| 12 | `closer_nome` | `text` | sim |  |  |  |
| 14 | `ativo` | `boolean` | sim | `true` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| check_sdr_closer_different | CHECK | `CHECK (sdr_id <> closer_id)` |  |  | sim |
| sdr_closer_assignments_closer_id_fkey | FOREIGN KEY | `FOREIGN KEY (closer_id) REFERENCES users(id)` | NO ACTION | NO ACTION | sim |
| sdr_closer_assignments_criado_por_id_fkey | FOREIGN KEY | `FOREIGN KEY (criado_por_id) REFERENCES users(id)` | NO ACTION | NO ACTION | sim |
| sdr_closer_assignments_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| sdr_closer_assignments_sdr_id_fkey | FOREIGN KEY | `FOREIGN KEY (sdr_id) REFERENCES users(id)` | NO ACTION | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_sdr_closer_assignments_criado_por_id | btree | criado_por_id | não | sim |  | `CREATE INDEX idx_sdr_closer_assignments_criado_por_id ON public.sdr_closer_assignments USING btree (criado_por_id)` |
| idx_sdr_closer_closer | btree | closer_id | não | sim |  | `CREATE INDEX idx_sdr_closer_closer ON public.sdr_closer_assignments USING btree (closer_id)` |
| idx_sdr_closer_sdr | btree | sdr_id | não | sim |  | `CREATE INDEX idx_sdr_closer_sdr ON public.sdr_closer_assignments USING btree (sdr_id)` |
| sdr_closer_assignments_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX sdr_closer_assignments_pkey ON public.sdr_closer_assignments USING btree (id)` |


## Policies (RLS)

### `read_only_auth`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |
| WITH CHECK |  |

### `service_full`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | service_role |
| USING | `true` |
| WITH CHECK | `true` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| set_updated_at | BEFORE | UPDATE | ROW | enabled | public.set_updated_at |


## Grants

_nenhum_
