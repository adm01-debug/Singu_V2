# public.sms_campaign_recipients

> SINGU: Destinatários individuais de sms_campaigns.

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
| 2 | `campaign_id` | `uuid` | não |  |  |  |
| 3 | `user_id` | `uuid` | não |  |  |  |
| 4 | `contact_id` | `uuid` | sim |  |  |  |
| 5 | `phone_number` | `text` | não |  |  |  |
| 6 | `status` | `text` | não | `'pending'::text` |  |  |
| 7 | `sent_at` | `timestamp with time zone` | sim |  |  |  |
| 8 | `delivered_at` | `timestamp with time zone` | sim |  |  |  |
| 9 | `failed_at` | `timestamp with time zone` | sim |  |  |  |
| 10 | `failure_reason` | `text` | sim |  |  |  |
| 11 | `provider_message_id` | `text` | sim |  |  |  |
| 12 | `cost` | `numeric(10,4)` | sim |  |  |  |
| 13 | `metadata` | `jsonb` | sim | `'{}'::jsonb` |  |  |
| 14 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 15 | `phone` | `text` | sim |  |  |  |
| 16 | `error_message` | `text` | sim |  |  |  |
| 17 | `replied_at` | `timestamp with time zone` | sim |  |  |  |
| 18 | `cost_cents` | `integer` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| sms_campaign_recipients_campaign_id_fkey | FOREIGN KEY | `FOREIGN KEY (campaign_id) REFERENCES sms_campaigns(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| sms_campaign_recipients_contact_id_fkey | FOREIGN KEY | `FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| sms_campaign_recipients_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| sms_campaign_recipients_status_check | CHECK | `CHECK (status = ANY (ARRAY['pending'::text, 'sent'::text, 'delivered'::text, 'failed'::text, 'opted_out'::text]))` |  |  | sim |
| uq_sms_campaign_recipients_campaign_phone | UNIQUE | `UNIQUE (campaign_id, phone_number)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_sms_campaign_recipients_user_id | btree | user_id | não | sim |  | `CREATE INDEX idx_sms_campaign_recipients_user_id ON public.sms_campaign_recipients USING btree (user_id)` |
| idx_sms_recipients_campaign | btree | campaign_id, status | não | sim |  | `CREATE INDEX idx_sms_recipients_campaign ON public.sms_campaign_recipients USING btree (campaign_id, status)` |
| sms_campaign_recipients_campaign_id_contact_id_key | btree | campaign_id, contact_id | sim | sim |  | `CREATE UNIQUE INDEX sms_campaign_recipients_campaign_id_contact_id_key ON public.sms_campaign_recipients USING btree (campaign_id, contact_id)` |
| sms_campaign_recipients_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX sms_campaign_recipients_pkey ON public.sms_campaign_recipients USING btree (id)` |
| uq_sms_campaign_recipients_campaign_phone | btree | campaign_id, phone_number | sim | sim |  | `CREATE UNIQUE INDEX uq_sms_campaign_recipients_campaign_phone ON public.sms_campaign_recipients USING btree (campaign_id, phone_number)` |


## Policies (RLS)

### `Delete recipients of own SMS campaigns`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(EXISTS ( SELECT 1    FROM sms_campaigns c   WHERE ((c.id = sms_campaign_recipients.campaign_id) AND (c.user_id = ( SELECT auth.uid() AS uid)))))` |
| WITH CHECK |  |

### `Insert recipients of own SMS campaigns`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(EXISTS ( SELECT 1    FROM sms_campaigns c   WHERE ((c.id = sms_campaign_recipients.campaign_id) AND (c.user_id = ( SELECT auth.uid() AS uid)))))` |

### `Update recipients of own SMS campaigns`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(EXISTS ( SELECT 1    FROM sms_campaigns c   WHERE ((c.id = sms_campaign_recipients.campaign_id) AND (c.user_id = ( SELECT auth.uid() AS uid)))))` |
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

### `View recipients of own SMS campaigns`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(EXISTS ( SELECT 1    FROM sms_campaigns c   WHERE ((c.id = sms_campaign_recipients.campaign_id) AND (c.user_id = ( SELECT auth.uid() AS uid)))))` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
