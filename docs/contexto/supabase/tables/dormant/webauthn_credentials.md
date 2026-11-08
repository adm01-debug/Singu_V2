# _dormant.webauthn_credentials

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
| 3 | `credential_id` | `text` | não |  |  |  |
| 4 | `public_key` | `text` | não |  |  |  |
| 5 | `sign_count` | `integer` | sim | `0` |  |  |
| 6 | `device_name` | `text` | sim |  |  |  |
| 7 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 8 | `last_used_at` | `timestamp with time zone` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| webauthn_credentials_credential_id_key | UNIQUE | `UNIQUE (credential_id)` |  |  | sim |
| webauthn_credentials_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| webauthn_credentials_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| webauthn_credentials_credential_id_key | btree | credential_id | sim | sim |  | `CREATE UNIQUE INDEX webauthn_credentials_credential_id_key ON _dormant.webauthn_credentials USING btree (credential_id)` |
| webauthn_credentials_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX webauthn_credentials_pkey ON _dormant.webauthn_credentials USING btree (id)` |


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
