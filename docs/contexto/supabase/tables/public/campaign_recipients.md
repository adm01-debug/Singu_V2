# public.campaign_recipients

> SINGU: Destinatários individuais de email_campaigns com tracking granular (opens, clicks, bounces).

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
| 2 | `campaign_id` | `uuid` | não |  |  |  |
| 3 | `user_id` | `uuid` | não |  |  |  |
| 4 | `contact_id` | `uuid` | sim |  |  |  |
| 5 | `email` | `text` | não |  |  |  |
| 6 | `status` | `text` | não | `'pending'::text` |  |  |
| 7 | `sent_at` | `timestamp with time zone` | sim |  |  |  |
| 8 | `delivered_at` | `timestamp with time zone` | sim |  |  |  |
| 9 | `opened_at` | `timestamp with time zone` | sim |  |  |  |
| 10 | `clicked_at` | `timestamp with time zone` | sim |  |  |  |
| 11 | `bounced_at` | `timestamp with time zone` | sim |  |  |  |
| 12 | `bounce_reason` | `text` | sim |  |  |  |
| 13 | `opens_count` | `integer` | sim | `0` |  |  |
| 14 | `clicks_count` | `integer` | sim | `0` |  |  |
| 15 | `last_opened_at` | `timestamp with time zone` | sim |  |  |  |
| 16 | `last_clicked_url` | `text` | sim |  |  |  |
| 17 | `ab_variant` | `text` | sim |  |  |  |
| 18 | `metadata` | `jsonb` | sim | `'{}'::jsonb` |  |  |
| 19 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| campaign_recipients_campaign_id_fkey | FOREIGN KEY | `FOREIGN KEY (campaign_id) REFERENCES email_campaigns(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| campaign_recipients_contact_id_fkey | FOREIGN KEY | `FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| campaign_recipients_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| campaign_recipients_status_check | CHECK | `CHECK (status = ANY (ARRAY['pending'::text, 'sent'::text, 'delivered'::text, 'opened'::text, 'clicked'::text, 'bounced'::text, 'complained'::text, 'unsubscribed'::text, 'failed'::text]))` |  |  | sim |
| uq_campaign_recipients_campaign_email | UNIQUE | `UNIQUE (campaign_id, email)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| campaign_recipients_campaign_id_contact_id_key | btree | campaign_id, contact_id | sim | sim |  | `CREATE UNIQUE INDEX campaign_recipients_campaign_id_contact_id_key ON public.campaign_recipients USING btree (campaign_id, contact_id)` |
| campaign_recipients_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX campaign_recipients_pkey ON public.campaign_recipients USING btree (id)` |
| idx_campaign_recipients_user_id | btree | user_id | não | sim |  | `CREATE INDEX idx_campaign_recipients_user_id ON public.campaign_recipients USING btree (user_id)` |
| uq_campaign_recipients_campaign_email | btree | campaign_id, email | sim | sim |  | `CREATE UNIQUE INDEX uq_campaign_recipients_campaign_email ON public.campaign_recipients USING btree (campaign_id, email)` |


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

### `Users manage campaign recipients`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(EXISTS ( SELECT 1    FROM email_campaigns ec   WHERE ((ec.id = campaign_recipients.campaign_id) AND (ec.user_id = ( SELECT auth.uid() AS uid)))))` |
| WITH CHECK | `(EXISTS ( SELECT 1    FROM email_campaigns ec   WHERE ((ec.id = campaign_recipients.campaign_id) AND (ec.user_id = ( SELECT auth.uid() AS uid)))))` |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
