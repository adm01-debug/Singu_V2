# public.sm_upload_mapping

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
| 1 | `request_id` | `bigint` | não |  |  |  |
| 2 | `staging_id` | `uuid` | não |  |  |  |
| 3 | `cf_custom_id` | `text` | não |  |  |  |
| 4 | `source_url` | `text` | não |  |  |  |
| 5 | `dispatched_at` | `timestamp with time zone` | não | `now()` |  |  |
| 6 | `harvested_at` | `timestamp with time zone` | sim |  |  |  |
| 7 | `status` | `text` | sim | `'pending'::text` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| sm_upload_mapping_pkey | PRIMARY KEY | `PRIMARY KEY (request_id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| sm_upload_mapping_pkey | btree | request_id | sim | sim |  | `CREATE UNIQUE INDEX sm_upload_mapping_pkey ON public.sm_upload_mapping USING btree (request_id)` |


## Policies (RLS)

### `sm_upload_mapping_internal_deny_all`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | RESTRICTIVE |
| roles | anon, authenticated |
| USING | `false` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

_nenhum_
