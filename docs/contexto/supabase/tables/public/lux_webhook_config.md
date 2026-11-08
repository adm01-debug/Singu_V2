# public.lux_webhook_config

> SINGU: Configurações de webhooks do módulo Lux Intelligence. Cada linha = 1 endpoint n8n/externo para enriquecimento profundo (redes sociais, CNPJ, LinkedIn). Inclui auth, retry exponencial, rate limiting e estatísticas. Admin UI: /admin/lux-config.

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 8 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `user_id` | `uuid` | não |  |  |  |
| 3 | `config_name` | `text` | não |  |  |  |
| 4 | `description` | `text` | sim |  |  |  |
| 5 | `webhook_url` | `text` | não |  |  |  |
| 6 | `webhook_method` | `text` | sim | `'POST'::text` |  |  |
| 7 | `auth_type` | `text` | sim | `'none'::text` |  |  |
| 8 | `auth_secret_name` | `text` | sim |  |  |  |
| 9 | `custom_headers` | `jsonb` | sim | `'{}'::jsonb` |  |  |
| 10 | `scrape_target` | `text` | não |  |  |  |
| 11 | `scrape_sources` | `text[]` | sim | `'{linkedin,instagram,facebook,cnpj,receita_federal}'::text[]` |  |  |
| 12 | `timeout_seconds` | `integer` | sim | `60` |  |  |
| 13 | `retry_max_attempts` | `integer` | sim | `3` |  |  |
| 14 | `retry_backoff_base_ms` | `integer` | sim | `1000` |  |  |
| 15 | `retry_strategy` | `text` | sim | `'exponential'::text` |  |  |
| 16 | `rate_limit_per_minute` | `integer` | sim | `10` |  |  |
| 17 | `rate_limit_per_hour` | `integer` | sim | `100` |  |  |
| 18 | `total_calls` | `integer` | sim | `0` |  |  |
| 19 | `total_successes` | `integer` | sim | `0` |  |  |
| 20 | `total_failures` | `integer` | sim | `0` |  |  |
| 21 | `last_called_at` | `timestamp with time zone` | sim |  |  |  |
| 22 | `last_success_at` | `timestamp with time zone` | sim |  |  |  |
| 23 | `last_failure_at` | `timestamp with time zone` | sim |  |  |  |
| 24 | `last_failure_reason` | `text` | sim |  |  |  |
| 25 | `is_active` | `boolean` | sim | `true` |  |  |
| 26 | `is_default` | `boolean` | sim | `false` |  |  |
| 27 | `priority` | `integer` | sim | `100` |  |  |
| 28 | `metadata` | `jsonb` | sim | `'{}'::jsonb` |  |  |
| 29 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 30 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |
| 31 | `entity_type` | `text` | sim |  |  |  |
| 32 | `timeout_ms` | `integer` | sim | `60000` |  |  |
| 33 | `max_retries` | `integer` | sim | `3` |  |  |
| 34 | `headers` | `jsonb` | sim | `'{}'::jsonb` |  |  |
| 35 | `last_test_at` | `timestamp with time zone` | sim |  |  |  |
| 36 | `last_test_status` | `text` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| lux_webhook_config_auth_type_check | CHECK | `CHECK (auth_type = ANY (ARRAY['none'::text, 'bearer'::text, 'basic'::text, 'api_key'::text, 'hmac_signature'::text]))` |  |  | sim |
| lux_webhook_config_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| lux_webhook_config_retry_strategy_check | CHECK | `CHECK (retry_strategy = ANY (ARRAY['linear'::text, 'exponential'::text, 'constant'::text]))` |  |  | sim |
| lux_webhook_config_scrape_target_check | CHECK | `CHECK (scrape_target = ANY (ARRAY['company'::text, 'contact'::text, 'both'::text]))` |  |  | sim |
| lux_webhook_config_webhook_method_check | CHECK | `CHECK (webhook_method = ANY (ARRAY['POST'::text, 'PUT'::text, 'PATCH'::text]))` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_lux_webhook_config_one_default_per_user | btree | user_id | sim | sim | `(is_default = true)` | `CREATE UNIQUE INDEX idx_lux_webhook_config_one_default_per_user ON public.lux_webhook_config USING btree (user_id) WHERE (is_default = true)` |
| lux_webhook_config_entity_type_key | btree | entity_type | sim | sim |  | `CREATE UNIQUE INDEX lux_webhook_config_entity_type_key ON public.lux_webhook_config USING btree (entity_type)` |
| lux_webhook_config_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX lux_webhook_config_pkey ON public.lux_webhook_config USING btree (id)` |


## Policies (RLS)

### `Admins can delete lux_webhook_config`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)` |
| WITH CHECK |  |

### `Admins can insert lux_webhook_config`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)` |

### `Admins can update lux_webhook_config`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)` |
| WITH CHECK |  |

### `Admins can view lux_webhook_config`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)` |
| WITH CHECK |  |

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


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| update_lux_webhook_config_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

_nenhum_
