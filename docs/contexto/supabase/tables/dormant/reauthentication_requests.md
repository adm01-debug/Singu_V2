# _dormant.reauthentication_requests

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | não |
| RLS forçado (owner) | não |
| policies | 0 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `user_id` | `uuid` | não |  |  |  |
| 3 | `action` | `text` | não |  |  |  |
| 4 | `status` | `text` | sim | `'pending'::text` |  |  |
| 5 | `ip_address` | `text` | sim |  |  |  |
| 6 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 7 | `expires_at` | `timestamp with time zone` | sim |  |  |  |
| 8 | `verified_at` | `timestamp with time zone` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| reauthentication_requests_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| reauthentication_requests_status_check | CHECK | `CHECK (status = ANY (ARRAY['pending'::text, 'verified'::text, 'expired'::text, 'failed'::text]))` |  |  | sim |
| reauthentication_requests_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| reauthentication_requests_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX reauthentication_requests_pkey ON _dormant.reauthentication_requests USING btree (id)` |


## Policies (RLS)

> ⚠️ RLS **desabilitado** nesta tabela.



## Triggers

_nenhum_


## Grants

_nenhum_
