# _dormant.whatsapp_kpis

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
| 3 | `instance_name` | `text` | não |  |  |  |
| 4 | `period_start` | `timestamp with time zone` | não |  |  |  |
| 5 | `period_end` | `timestamp with time zone` | não |  |  |  |
| 6 | `messages_sent` | `integer` | sim | `0` |  |  |
| 7 | `messages_received` | `integer` | sim | `0` |  |  |
| 8 | `messages_delivered` | `integer` | sim | `0` |  |  |
| 9 | `messages_read` | `integer` | sim | `0` |  |  |
| 10 | `avg_response_time_seconds` | `integer` | sim |  |  |  |
| 11 | `delivery_rate` | `numeric` | sim |  |  |  |
| 12 | `read_rate` | `numeric` | sim |  |  |  |
| 13 | `unique_contacts` | `integer` | sim | `0` |  |  |
| 14 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| whatsapp_kpis_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| whatsapp_kpis_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX whatsapp_kpis_pkey ON _dormant.whatsapp_kpis USING btree (id)` |


## Policies (RLS)

### `Users can manage their own whatsapp_kpis`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | public |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |


## Triggers

_nenhum_


## Grants

_nenhum_
