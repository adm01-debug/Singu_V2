# public.validation_queue

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 3 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `user_id` | `uuid` | não |  |  |  |
| 3 | `contact_id` | `uuid` | sim |  |  |  |
| 4 | `kind` | `validation_kind` | não |  |  |  |
| 5 | `value` | `text` | não |  |  |  |
| 6 | `status` | `validation_queue_status` | não | `'pending'::validation_queue_status` |  |  |
| 7 | `attempts` | `integer` | não | `0` |  |  |
| 8 | `last_error` | `text` | sim |  |  |  |
| 9 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 10 | `processed_at` | `timestamp with time zone` | sim |  |  |  |
| 11 | `lease_expires_at` | `timestamp with time zone` | sim |  |  |  |
| 12 | `claim_token` | `uuid` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| validation_queue_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_validation_queue_contact | btree | contact_id | não | sim |  | `CREATE INDEX idx_validation_queue_contact ON public.validation_queue USING btree (contact_id)` |
| idx_validation_queue_status_created | btree | status, created_at | não | sim |  | `CREATE INDEX idx_validation_queue_status_created ON public.validation_queue USING btree (status, created_at)` |
| idx_validation_queue_user | btree | user_id | não | sim |  | `CREATE INDEX idx_validation_queue_user ON public.validation_queue USING btree (user_id)` |
| validation_queue_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX validation_queue_pkey ON public.validation_queue USING btree (id)` |


## Policies (RLS)

### `users insert own validation queue`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |

### `users update own validation queue`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `users view own validation queue`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
