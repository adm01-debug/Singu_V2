# public.uapi_sessions

> Sessões UAPI Lalamove - tokens e credenciais para integração com br-uapi.lalamove.com

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
| 2 | `provider` | `text` | não | `'lalamove'::text` |  |  |
| 3 | `label` | `text` | não | `'default'::text` |  |  |
| 4 | `token` | `text` | não |  |  | Token de autenticação passado como query param nas requests UAPI |
| 5 | `refresh_token` | `text` | sim |  |  |  |
| 6 | `device_id` | `text` | não |  |  |  |
| 7 | `username` | `text` | sim |  |  |  |
| 8 | `base_url` | `text` | não | `'https://br-uapi.lalamove.com'::text` |  |  |
| 9 | `city_id` | `text` | não | `'21001'::text` |  |  |
| 10 | `hcountry` | `text` | não | `'20000'::text` |  |  |
| 11 | `hlang` | `text` | não | `'pt_br'::text` |  |  |
| 12 | `version` | `text` | não | `'5.38.0'::text` |  |  |
| 13 | `revision` | `text` | não | `'53800'::text` |  |  |
| 14 | `is_ep` | `text` | não | `'1'::text` |  |  |
| 15 | `x_sign_js` | `text` | sim |  |  | Header x-sign-js - pode mudar por sessão |
| 16 | `x_javascript_fingerprinting` | `text` | sim |  |  | Header de fingerprinting do browser |
| 17 | `x_h5_sdkversion` | `text` | sim | `'4000'::text` |  |  |
| 18 | `is_active` | `boolean` | não | `true` |  |  |
| 19 | `expires_at` | `timestamp with time zone` | sim |  |  |  |
| 20 | `last_used_at` | `timestamp with time zone` | sim |  |  |  |
| 21 | `last_refreshed_at` | `timestamp with time zone` | sim |  |  |  |
| 22 | `notes` | `text` | sim |  |  |  |
| 23 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 24 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |
| 25 | `api_key` | `text` | sim |  |  | Public key para API Oficial v3 (pk_prod_...) |
| 26 | `api_secret` | `text` | sim |  |  | Secret key para API Oficial v3 (sk_prod_...) |
| 27 | `market` | `text` | sim | `'BR'::text` |  |  |
| 28 | `auth_type` | `text` | não | `'token_query'::text` |  | token_query = UAPI, hmac_sha256 = API Oficial v3 |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| uapi_sessions_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_uapi_sessions_active | btree | provider, label | sim | sim | `(is_active = true)` | `CREATE UNIQUE INDEX idx_uapi_sessions_active ON public.uapi_sessions USING btree (provider, label) WHERE (is_active = true)` |
| uapi_sessions_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX uapi_sessions_pkey ON public.uapi_sessions USING btree (id)` |


## Policies (RLS)

### `uapi_sessions_service_only`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | service_role |
| USING | `true` |
| WITH CHECK | `true` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| set_updated_at | BEFORE | UPDATE | ROW | enabled | public.set_updated_at |
| trg_uapi_sessions_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_uapi_sessions_updated_at |


## Grants

_nenhum_
