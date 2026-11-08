# _dormant.mfa_verification_attempts

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
| 2 | `user_id` | `uuid` | sim |  |  |  |
| 3 | `method` | `text` | não |  |  |  |
| 4 | `success` | `boolean` | sim | `false` |  |  |
| 5 | `ip_address` | `text` | sim |  |  |  |
| 6 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| mfa_verification_attempts_method_check | CHECK | `CHECK (method = ANY (ARRAY['totp'::text, 'sms'::text]))` |  |  | sim |
| mfa_verification_attempts_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| mfa_verification_attempts_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| mfa_verification_attempts_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX mfa_verification_attempts_pkey ON _dormant.mfa_verification_attempts USING btree (id)` |


## Policies (RLS)

> ⚠️ RLS **desabilitado** nesta tabela.



## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| anon | SELECT |
| authenticated | SELECT |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
