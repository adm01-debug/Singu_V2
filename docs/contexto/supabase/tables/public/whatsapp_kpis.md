# public.whatsapp_kpis

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 5 |
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
| idx_whatsapp_kpis_user_id | btree | user_id | não | sim |  | `CREATE INDEX idx_whatsapp_kpis_user_id ON public.whatsapp_kpis USING btree (user_id)` |
| whatsapp_kpis_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX whatsapp_kpis_pkey ON public.whatsapp_kpis USING btree (id)` |


## Policies (RLS)

### `Users can manage their own whatsapp_kpis`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(auth.uid() = user_id)` |
| WITH CHECK | `(auth.uid() = user_id)` |

### `whatsapp_kpis_delete`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(user_id = ( SELECT auth.uid() AS uid))` |
| WITH CHECK |  |

### `whatsapp_kpis_insert`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(user_id = ( SELECT auth.uid() AS uid))` |

### `whatsapp_kpis_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(user_id = ( SELECT auth.uid() AS uid))` |
| WITH CHECK |  |

### `whatsapp_kpis_update`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(user_id = ( SELECT auth.uid() AS uid))` |
| WITH CHECK | `(user_id = ( SELECT auth.uid() AS uid))` |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
