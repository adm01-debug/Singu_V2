# public.rfm_segment_config

> SINGU: Configuração dos segmentos RFM

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
| 2 | `segment_code` | `text` | não |  |  |  |
| 3 | `name` | `text` | não |  |  |  |
| 4 | `name_pt` | `text` | sim |  |  |  |
| 5 | `description` | `text` | sim |  |  |  |
| 6 | `description_pt` | `text` | sim |  |  |  |
| 7 | `recency_min` | `integer` | não |  |  |  |
| 8 | `recency_max` | `integer` | não |  |  |  |
| 9 | `frequency_min` | `integer` | não |  |  |  |
| 10 | `frequency_max` | `integer` | não |  |  |  |
| 11 | `monetary_min` | `integer` | não |  |  |  |
| 12 | `monetary_max` | `integer` | não |  |  |  |
| 13 | `recommended_actions` | `text[]` | sim | `'{}'::text[]` |  |  |
| 14 | `recommended_actions_pt` | `text[]` | sim | `'{}'::text[]` |  |  |
| 15 | `communication_frequency` | `text` | sim |  |  |  |
| 16 | `communication_channels` | `text[]` | sim | `'{}'::text[]` |  |  |
| 17 | `effective_triggers` | `text[]` | sim | `'{}'::text[]` |  |  |
| 18 | `offer_types` | `text[]` | sim | `'{}'::text[]` |  |  |
| 19 | `color` | `text` | sim |  |  |  |
| 20 | `icon` | `text` | sim |  |  |  |
| 21 | `priority` | `integer` | sim | `0` |  |  |
| 22 | `is_active` | `boolean` | sim | `true` |  |  |
| 23 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 24 | `updated_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 25 | `user_id` | `uuid` | sim |  |  |  |
| 26 | `segment_name` | `text` | sim |  |  |  |
| 27 | `segment_key` | `text` | sim |  |  |  |
| 28 | `email_template` | `text` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| rfm_segment_config_frequency_max_check | CHECK | `CHECK (frequency_max >= 1 AND frequency_max <= 5)` |  |  | sim |
| rfm_segment_config_frequency_min_check | CHECK | `CHECK (frequency_min >= 1 AND frequency_min <= 5)` |  |  | sim |
| rfm_segment_config_monetary_max_check | CHECK | `CHECK (monetary_max >= 1 AND monetary_max <= 5)` |  |  | sim |
| rfm_segment_config_monetary_min_check | CHECK | `CHECK (monetary_min >= 1 AND monetary_min <= 5)` |  |  | sim |
| rfm_segment_config_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| rfm_segment_config_recency_max_check | CHECK | `CHECK (recency_max >= 1 AND recency_max <= 5)` |  |  | sim |
| rfm_segment_config_recency_min_check | CHECK | `CHECK (recency_min >= 1 AND recency_min <= 5)` |  |  | sim |
| rfm_segment_config_segment_code_key | UNIQUE | `UNIQUE (segment_code)` |  |  | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| _dormant.contact_rfm_scores | contact_rfm_scores_segment_id_fkey | segment_id | NO ACTION |
| public.company_rfm_scores | company_rfm_scores_segment_id_fkey | segment_id | NO ACTION |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| rfm_segment_config_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX rfm_segment_config_pkey ON public.rfm_segment_config USING btree (id)` |
| rfm_segment_config_segment_code_key | btree | segment_code | sim | sim |  | `CREATE UNIQUE INDEX rfm_segment_config_segment_code_key ON public.rfm_segment_config USING btree (segment_code)` |
| rfm_segment_config_user_id_segment_key_key | btree | user_id, segment_key | sim | sim |  | `CREATE UNIQUE INDEX rfm_segment_config_user_id_segment_key_key ON public.rfm_segment_config USING btree (user_id, segment_key)` |


## Policies (RLS)

### `Users can manage their RFM segment config`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(auth.uid() = user_id)` |
| WITH CHECK |  |

### `rfm_segment_config_delete`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(user_id = ( SELECT auth.uid() AS uid))` |
| WITH CHECK |  |

### `rfm_segment_config_insert`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(user_id = ( SELECT auth.uid() AS uid))` |

### `rfm_segment_config_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(user_id = ( SELECT auth.uid() AS uid))` |
| WITH CHECK |  |

### `rfm_segment_config_update`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(user_id = ( SELECT auth.uid() AS uid))` |
| WITH CHECK | `(user_id = ( SELECT auth.uid() AS uid))` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| set_updated_at | BEFORE | UPDATE | ROW | enabled | public.set_updated_at |
| set_updated_at_rfm_segment_config | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
