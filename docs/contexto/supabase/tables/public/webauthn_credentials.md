# public.webauthn_credentials

> SINGU: Credenciais WebAuthn/Passkeys (FIDO2). counter protege contra replay. public_key em bytea.

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
| 3 | `credential_id` | `text` | não |  |  |  |
| 4 | `public_key` | `bytea` | não |  |  |  |
| 5 | `counter` | `bigint` | sim | `0` |  |  |
| 6 | `transports` | `text[]` | sim | `'{}'::text[]` |  |  |
| 7 | `aaguid` | `uuid` | sim |  |  |  |
| 8 | `device_type` | `text` | sim |  |  |  |
| 9 | `backup_eligible` | `boolean` | sim | `false` |  |  |
| 10 | `backup_state` | `boolean` | sim | `false` |  |  |
| 11 | `nickname` | `text` | sim |  |  |  |
| 12 | `is_active` | `boolean` | sim | `true` |  |  |
| 13 | `last_used_at` | `timestamp with time zone` | sim |  |  |  |
| 14 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 15 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |
| 16 | `label` | `text` | sim | `'Passkey'::text` |  |  |
| 17 | `sign_count` | `integer` | sim | `0` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| webauthn_credentials_credential_id_key | UNIQUE | `UNIQUE (credential_id)` |  |  | sim |
| webauthn_credentials_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_webauthn_credentials_user_id | btree | user_id | não | sim |  | `CREATE INDEX idx_webauthn_credentials_user_id ON public.webauthn_credentials USING btree (user_id)` |
| webauthn_credentials_credential_id_key | btree | credential_id | sim | sim |  | `CREATE UNIQUE INDEX webauthn_credentials_credential_id_key ON public.webauthn_credentials USING btree (credential_id)` |
| webauthn_credentials_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX webauthn_credentials_pkey ON public.webauthn_credentials USING btree (id)` |


## Policies (RLS)

### `Users can delete own`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `Users can insert own`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |

### `Users can update own`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |

### `Users can view own`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `Users manage own webauthn`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(user_id = ( SELECT auth.uid() AS uid))` |
| WITH CHECK | `(user_id = ( SELECT auth.uid() AS uid))` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| update_webauthn_credentials_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
