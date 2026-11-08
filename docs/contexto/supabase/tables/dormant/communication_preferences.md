# _dormant.communication_preferences

> SINGU: Preferências de comunicação por contato

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
| 2 | `user_id` | `uuid` | sim |  |  |  |
| 3 | `contact_id` | `uuid` | não |  |  |  |
| 4 | `preferred_channel` | `text` | sim |  |  |  |
| 5 | `secondary_channels` | `text[]` | sim | `'{}'::text[]` |  |  |
| 6 | `avoid_channels` | `text[]` | sim | `'{}'::text[]` |  |  |
| 7 | `preferred_days` | `text[]` | sim | `'{}'::text[]` |  |  |
| 8 | `preferred_time_start` | `time without time zone` | sim |  |  |  |
| 9 | `preferred_time_end` | `time without time zone` | sim |  |  |  |
| 10 | `avoid_days` | `text[]` | sim | `'{}'::text[]` |  |  |
| 11 | `avoid_time_start` | `time without time zone` | sim |  |  |  |
| 12 | `avoid_time_end` | `time without time zone` | sim |  |  |  |
| 13 | `timezone` | `text` | sim | `'America/Sao_Paulo'::text` |  |  |
| 14 | `preferred_frequency` | `text` | sim |  |  |  |
| 15 | `formality_level` | `integer` | sim | `3` |  |  |
| 16 | `prefers_short_messages` | `boolean` | sim |  |  |  |
| 17 | `prefers_detailed_info` | `boolean` | sim |  |  |  |
| 18 | `prefers_visual_content` | `boolean` | sim |  |  |  |
| 19 | `prefers_data_driven` | `boolean` | sim |  |  |  |
| 20 | `preferred_language` | `text` | sim | `'pt-BR'::text` |  |  |
| 21 | `opted_out_marketing` | `boolean` | sim | `false` |  |  |
| 22 | `opted_out_calls` | `boolean` | sim | `false` |  |  |
| 23 | `opted_out_sms` | `boolean` | sim | `false` |  |  |
| 24 | `notes` | `text` | sim |  |  |  |
| 25 | `source` | `text` | sim |  |  |  |
| 26 | `last_confirmed_at` | `timestamp with time zone` | sim |  |  |  |
| 27 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 28 | `updated_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| communication_preferences_contact_id_fkey | FOREIGN KEY | `FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| communication_preferences_formality_level_check | CHECK | `CHECK (formality_level >= 1 AND formality_level <= 5)` |  |  | sim |
| communication_preferences_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| communication_preferences_preferred_channel_check | CHECK | `CHECK (preferred_channel = ANY (ARRAY['whatsapp'::text, 'email'::text, 'phone'::text, 'sms'::text, 'meeting'::text, 'video_call'::text]))` |  |  | sim |
| communication_preferences_preferred_frequency_check | CHECK | `CHECK (preferred_frequency = ANY (ARRAY['daily'::text, 'every_few_days'::text, 'weekly'::text, 'bi_weekly'::text, 'monthly'::text, 'as_needed'::text]))` |  |  | sim |
| communication_preferences_source_check | CHECK | `CHECK (source = ANY (ARRAY['manual'::text, 'inferred'::text, 'asked'::text, 'imported'::text]))` |  |  | sim |
| communication_preferences_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| communication_preferences_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX communication_preferences_pkey ON _dormant.communication_preferences USING btree (id)` |
| idx_comm_prefs_unique | btree | contact_id | sim | sim |  | `CREATE UNIQUE INDEX idx_comm_prefs_unique ON _dormant.communication_preferences USING btree (contact_id)` |


## Policies (RLS)

### `dormant_deny_all_communication_preferences`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | RESTRICTIVE |
| roles | public |
| USING | `false` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

_nenhum_
