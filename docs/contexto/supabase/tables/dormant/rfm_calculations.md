# _dormant.rfm_calculations

> SINGU: Log de execução dos cálculos RFM

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
| 2 | `user_id` | `uuid` | não |  |  |  |
| 3 | `calculation_type` | `text` | não |  |  |  |
| 4 | `contacts_processed` | `integer` | sim | `0` |  |  |
| 5 | `contacts_updated` | `integer` | sim | `0` |  |  |
| 6 | `segments_changed` | `integer` | sim | `0` |  |  |
| 7 | `parameters` | `jsonb` | sim | `'{}'::jsonb` |  |  |
| 8 | `started_at` | `timestamp with time zone` | não |  |  |  |
| 9 | `completed_at` | `timestamp with time zone` | sim |  |  |  |
| 10 | `duration_ms` | `integer` | sim |  |  |  |
| 11 | `status` | `text` | sim | `'running'::text` |  |  |
| 12 | `error_message` | `text` | sim |  |  |  |
| 13 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| rfm_calculations_calculation_type_check | CHECK | `CHECK (calculation_type = ANY (ARRAY['full'::text, 'incremental'::text, 'single_contact'::text, 'segment_only'::text]))` |  |  | sim |
| rfm_calculations_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| rfm_calculations_status_check | CHECK | `CHECK (status = ANY (ARRAY['running'::text, 'completed'::text, 'failed'::text]))` |  |  | sim |
| rfm_calculations_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| rfm_calculations_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX rfm_calculations_pkey ON _dormant.rfm_calculations USING btree (id)` |


## Policies (RLS)

### `dormant_deny_all_rfm_calculations`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | RESTRICTIVE |
| roles | public |
| USING | `false` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

_nenhum_
