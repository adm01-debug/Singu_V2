# public.email_campaigns

> SINGU: Campanhas de email marketing com Email Builder Visual (blocos), A/B test, agendamento e métricas full-funnel.

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
| 3 | `name` | `text` | não |  |  |  |
| 4 | `subject` | `text` | não |  |  |  |
| 5 | `preheader` | `text` | sim |  |  |  |
| 6 | `from_name` | `text` | sim |  |  |  |
| 7 | `from_email` | `text` | sim |  |  |  |
| 8 | `reply_to` | `text` | sim |  |  |  |
| 9 | `html_body` | `text` | sim |  |  |  |
| 10 | `text_body` | `text` | sim |  |  |  |
| 11 | `builder_blocks` | `jsonb` | sim | `'[]'::jsonb` |  |  |
| 12 | `template_id` | `uuid` | sim |  |  |  |
| 13 | `status` | `text` | não | `'draft'::text` |  |  |
| 14 | `scheduled_at` | `timestamp with time zone` | sim |  |  |  |
| 15 | `sent_at` | `timestamp with time zone` | sim |  |  |  |
| 16 | `total_recipients` | `integer` | sim | `0` |  |  |
| 17 | `total_sent` | `integer` | sim | `0` |  |  |
| 18 | `total_delivered` | `integer` | sim | `0` |  |  |
| 19 | `total_opened` | `integer` | sim | `0` |  |  |
| 20 | `total_clicked` | `integer` | sim | `0` |  |  |
| 21 | `total_bounced` | `integer` | sim | `0` |  |  |
| 22 | `total_complained` | `integer` | sim | `0` |  |  |
| 23 | `total_unsubscribed` | `integer` | sim | `0` |  |  |
| 24 | `open_rate` | `numeric(5,2)` | sim |  |  |  |
| 25 | `click_rate` | `numeric(5,2)` | sim |  |  |  |
| 26 | `segment_filter` | `jsonb` | sim | `'{}'::jsonb` |  |  |
| 27 | `ab_test_config` | `jsonb` | sim |  |  |  |
| 28 | `metadata` | `jsonb` | sim | `'{}'::jsonb` |  |  |
| 29 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 30 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |
| 31 | `content_html` | `text` | sim |  |  |  |
| 32 | `content_text` | `text` | sim |  |  |  |
| 33 | `tags` | `text[]` | sim | `'{}'::text[]` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| email_campaigns_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| email_campaigns_status_check | CHECK | `CHECK (status = ANY (ARRAY['draft'::text, 'scheduled'::text, 'sending'::text, 'sent'::text, 'paused'::text, 'cancelled'::text, 'failed'::text]))` |  |  | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.campaign_recipients | campaign_recipients_campaign_id_fkey | campaign_id | CASCADE |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| email_campaigns_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX email_campaigns_pkey ON public.email_campaigns USING btree (id)` |
| idx_email_campaigns_user_id | btree | user_id | não | sim |  | `CREATE INDEX idx_email_campaigns_user_id ON public.email_campaigns USING btree (user_id)` |


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

### `Users manage own campaigns`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| update_email_campaigns_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
