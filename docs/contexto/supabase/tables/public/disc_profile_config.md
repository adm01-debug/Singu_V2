# public.disc_profile_config

> SINGU: Configuração e características de cada perfil DISC

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 2 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |
| usada por views | public.vw_singu_disc_dashboard, public.vw_singu_readiness |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `profile_type` | `text` | não |  |  |  |
| 3 | `name` | `text` | não |  |  |  |
| 4 | `name_pt` | `text` | sim |  |  |  |
| 5 | `description` | `text` | não |  |  |  |
| 6 | `description_pt` | `text` | sim |  |  |  |
| 7 | `strengths` | `text[]` | sim | `'{}'::text[]` |  |  |
| 8 | `strengths_pt` | `text[]` | sim | `'{}'::text[]` |  |  |
| 9 | `weaknesses` | `text[]` | sim | `'{}'::text[]` |  |  |
| 10 | `weaknesses_pt` | `text[]` | sim | `'{}'::text[]` |  |  |
| 11 | `motivators` | `text[]` | sim | `'{}'::text[]` |  |  |
| 12 | `motivators_pt` | `text[]` | sim | `'{}'::text[]` |  |  |
| 13 | `fears` | `text[]` | sim | `'{}'::text[]` |  |  |
| 14 | `fears_pt` | `text[]` | sim | `'{}'::text[]` |  |  |
| 15 | `communication_style` | `text` | sim |  |  |  |
| 16 | `communication_style_pt` | `text` | sim |  |  |  |
| 17 | `communication_tips` | `text[]` | sim | `'{}'::text[]` |  |  |
| 18 | `communication_tips_pt` | `text[]` | sim | `'{}'::text[]` |  |  |
| 19 | `sales_approach` | `text` | sim |  |  |  |
| 20 | `sales_approach_pt` | `text` | sim |  |  |  |
| 21 | `objection_handling` | `text` | sim |  |  |  |
| 22 | `objection_handling_pt` | `text` | sim |  |  |  |
| 23 | `closing_techniques` | `text[]` | sim | `'{}'::text[]` |  |  |
| 24 | `closing_techniques_pt` | `text[]` | sim | `'{}'::text[]` |  |  |
| 25 | `effective_triggers` | `text[]` | sim | `'{}'::text[]` |  |  |
| 26 | `effective_triggers_pt` | `text[]` | sim | `'{}'::text[]` |  |  |
| 27 | `keywords_to_use` | `text[]` | sim | `'{}'::text[]` |  |  |
| 28 | `keywords_to_avoid` | `text[]` | sim | `'{}'::text[]` |  |  |
| 29 | `color` | `text` | sim |  |  |  |
| 30 | `icon` | `text` | sim |  |  |  |
| 31 | `is_active` | `boolean` | sim | `true` |  |  |
| 32 | `sort_order` | `integer` | sim | `0` |  |  |
| 33 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 34 | `updated_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 35 | `short_description` | `text` | sim |  |  |  |
| 36 | `detailed_description` | `text` | sim |  |  |  |
| 37 | `core_drive` | `text` | sim |  |  |  |
| 38 | `core_fear` | `text` | sim |  |  |  |
| 39 | `under_pressure` | `text` | sim |  |  |  |
| 40 | `ideal_environment` | `text` | sim |  |  |  |
| 41 | `preferred_pace` | `text` | sim |  |  |  |
| 42 | `decision_making_style` | `text` | sim |  |  |  |
| 43 | `opening_strategies` | `jsonb` | não | `'[]'::jsonb` |  |  |
| 44 | `presentation_tips` | `jsonb` | não | `'[]'::jsonb` |  |  |
| 45 | `follow_up_approach` | `jsonb` | não | `'[]'::jsonb` |  |  |
| 46 | `power_words` | `jsonb` | não | `'[]'::jsonb` |  |  |
| 47 | `avoid_words` | `jsonb` | não | `'[]'::jsonb` |  |  |
| 48 | `detection_keywords` | `jsonb` | não | `'[]'::jsonb` |  |  |
| 49 | `typical_phrases` | `jsonb` | não | `'[]'::jsonb` |  |  |
| 50 | `compatibility_matrix` | `jsonb` | não | `'{}'::jsonb` |  |  |
| 51 | `color_scheme` | `jsonb` | não | `'{}'::jsonb` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| disc_profile_config_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| disc_profile_config_profile_type_check | CHECK | `CHECK (profile_type = ANY (ARRAY['D'::text, 'I'::text, 'S'::text, 'C'::text, 'DI'::text, 'DC'::text, 'ID'::text, 'IS'::text, 'SI'::text, 'SC'::text, 'CD'::text, 'CS'::text]))` |  |  | sim |
| disc_profile_config_profile_type_key | UNIQUE | `UNIQUE (profile_type)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| disc_profile_config_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX disc_profile_config_pkey ON public.disc_profile_config USING btree (id)` |
| disc_profile_config_profile_type_key | btree | profile_type | sim | sim |  | `CREATE UNIQUE INDEX disc_profile_config_profile_type_key ON public.disc_profile_config USING btree (profile_type)` |


## Policies (RLS)

### `Authenticated can read`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |
| WITH CHECK |  |

### `Authenticated users can view DISC profile configs`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `true` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| set_updated_at | BEFORE | UPDATE | ROW | enabled | public.set_updated_at |
| set_updated_at_disc_profile_config | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
