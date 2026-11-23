# public.secret_rotation_log

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
| 2 | `secret_name` | `text` | não |  |  |  |
| 3 | `rotated_at` | `timestamp with time zone` | não | `now()` |  |  |
| 4 | `rotated_by` | `uuid` | sim |  |  |  |
| 5 | `old_hash` | `text` | sim |  |  |  |
| 6 | `new_hash` | `text` | sim |  |  |  |
| 7 | `reason` | `text` | sim |  |  |  |
| 8 | `is_automatic` | `boolean` | sim | `false` |  |  |
| 9 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| secret_rotation_log_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_secret_rotation_name | btree | secret_name, rotated_at | não | sim |  | `CREATE INDEX idx_secret_rotation_name ON public.secret_rotation_log USING btree (secret_name, rotated_at DESC)` |
| secret_rotation_log_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX secret_rotation_log_pkey ON public.secret_rotation_log USING btree (id)` |


## Policies (RLS)

### `secret_rotation_admin_mfa_all`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role) AND (( SELECT (auth.jwt() ->> 'aal'::text)) = 'aal2'::text))` |
| WITH CHECK | `(( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role) AND (( SELECT (auth.jwt() ->> 'aal'::text)) = 'aal2'::text))` |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
