# _dormant.contact_metaprograms

> SINGU: Metaprogramas de PNL identificados por contato

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
| 4 | `motivation_direction` | `text` | sim |  |  |  |
| 5 | `motivation_direction_score` | `integer` | sim |  |  |  |
| 6 | `reference_frame` | `text` | sim |  |  |  |
| 7 | `reference_frame_score` | `integer` | sim |  |  |  |
| 8 | `chunk_size` | `text` | sim |  |  |  |
| 9 | `chunk_size_score` | `integer` | sim |  |  |  |
| 10 | `convincer_channel` | `text` | sim |  |  |  |
| 11 | `convincer_mode` | `text` | sim |  |  |  |
| 12 | `convincer_value` | `integer` | sim |  |  |  |
| 13 | `time_orientation` | `text` | sim |  |  |  |
| 14 | `work_style` | `text` | sim |  |  |  |
| 15 | `work_style_score` | `integer` | sim |  |  |  |
| 16 | `attention_focus` | `text` | sim |  |  |  |
| 17 | `stress_response` | `text` | sim |  |  |  |
| 18 | `overall_confidence` | `numeric(3,2)` | sim |  |  |  |
| 19 | `analysis_notes` | `text` | sim |  |  |  |
| 20 | `analyzed_at` | `timestamp with time zone` | sim |  |  |  |
| 21 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 22 | `updated_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| contact_metaprograms_attention_focus_check | CHECK | `CHECK (attention_focus = ANY (ARRAY['self'::text, 'others'::text, 'balanced'::text]))` |  |  | sim |
| contact_metaprograms_chunk_size_check | CHECK | `CHECK (chunk_size = ANY (ARRAY['big_picture'::text, 'detail'::text, 'both'::text]))` |  |  | sim |
| contact_metaprograms_chunk_size_score_check | CHECK | `CHECK (chunk_size_score >= '-10'::integer AND chunk_size_score <= 10)` |  |  | sim |
| contact_metaprograms_contact_id_fkey | FOREIGN KEY | `FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| contact_metaprograms_convincer_channel_check | CHECK | `CHECK (convincer_channel = ANY (ARRAY['see'::text, 'hear'::text, 'read'::text, 'do'::text]))` |  |  | sim |
| contact_metaprograms_convincer_mode_check | CHECK | `CHECK (convincer_mode = ANY (ARRAY['number'::text, 'period'::text, 'consistent'::text, 'automatic'::text]))` |  |  | sim |
| contact_metaprograms_motivation_direction_check | CHECK | `CHECK (motivation_direction = ANY (ARRAY['toward'::text, 'away_from'::text, 'both'::text]))` |  |  | sim |
| contact_metaprograms_motivation_direction_score_check | CHECK | `CHECK (motivation_direction_score >= '-10'::integer AND motivation_direction_score <= 10)` |  |  | sim |
| contact_metaprograms_overall_confidence_check | CHECK | `CHECK (overall_confidence >= 0::numeric AND overall_confidence <= 1::numeric)` |  |  | sim |
| contact_metaprograms_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| contact_metaprograms_reference_frame_check | CHECK | `CHECK (reference_frame = ANY (ARRAY['internal'::text, 'external'::text, 'both'::text]))` |  |  | sim |
| contact_metaprograms_reference_frame_score_check | CHECK | `CHECK (reference_frame_score >= '-10'::integer AND reference_frame_score <= 10)` |  |  | sim |
| contact_metaprograms_stress_response_check | CHECK | `CHECK (stress_response = ANY (ARRAY['feeling'::text, 'thinking'::text, 'choice'::text]))` |  |  | sim |
| contact_metaprograms_time_orientation_check | CHECK | `CHECK (time_orientation = ANY (ARRAY['past'::text, 'present'::text, 'future'::text, 'atemporal'::text]))` |  |  | sim |
| contact_metaprograms_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| contact_metaprograms_work_style_check | CHECK | `CHECK (work_style = ANY (ARRAY['proactive'::text, 'reactive'::text, 'both'::text]))` |  |  | sim |
| contact_metaprograms_work_style_score_check | CHECK | `CHECK (work_style_score >= '-10'::integer AND work_style_score <= 10)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| contact_metaprograms_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX contact_metaprograms_pkey ON _dormant.contact_metaprograms USING btree (id)` |
| idx_metaprograms_unique | btree | contact_id | sim | sim |  | `CREATE UNIQUE INDEX idx_metaprograms_unique ON _dormant.contact_metaprograms USING btree (contact_id)` |


## Policies (RLS)

### `dormant_deny_all_contact_metaprograms`

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

| role | privilégios |
|---|---|
| anon | SELECT |
| authenticated | SELECT |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
