# _dormant.user_mfa_settings

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
| 3 | `totp_enabled` | `boolean` | sim | `false` |  |  |
| 4 | `totp_secret` | `text` | sim |  |  |  |
| 5 | `totp_verified_at` | `timestamp with time zone` | sim |  |  |  |
| 6 | `sms_enabled` | `boolean` | sim | `false` |  |  |
| 7 | `phone_number` | `text` | sim |  |  |  |
| 8 | `phone_verified_at` | `timestamp with time zone` | sim |  |  |  |
| 9 | `backup_codes` | `text[]` | sim |  |  |  |
| 10 | `backup_codes_generated_at` | `timestamp with time zone` | sim |  |  |  |
| 11 | `preferred_method` | `text` | sim | `'totp'::text` |  |  |
| 12 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 13 | `updated_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| user_mfa_settings_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| user_mfa_settings_preferred_method_check | CHECK | `CHECK (preferred_method = ANY (ARRAY['totp'::text, 'sms'::text]))` |  |  | sim |
| user_mfa_settings_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| user_mfa_settings_user_id_key | UNIQUE | `UNIQUE (user_id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| user_mfa_settings_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX user_mfa_settings_pkey ON _dormant.user_mfa_settings USING btree (id)` |
| user_mfa_settings_user_id_key | btree | user_id | sim | sim |  | `CREATE UNIQUE INDEX user_mfa_settings_user_id_key ON _dormant.user_mfa_settings USING btree (user_id)` |


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
