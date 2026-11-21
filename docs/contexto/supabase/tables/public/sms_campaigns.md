# public.sms_campaigns

> SINGU: Campanhas de SMS com provider configurável, segmentação e tracking de custo.

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
| 4 | `message` | `text` | não |  |  |  |
| 5 | `sender_id` | `text` | sim |  |  |  |
| 6 | `status` | `text` | não | `'draft'::text` |  |  |
| 7 | `scheduled_at` | `timestamp with time zone` | sim |  |  |  |
| 8 | `sent_at` | `timestamp with time zone` | sim |  |  |  |
| 9 | `total_recipients` | `integer` | sim | `0` |  |  |
| 10 | `total_sent` | `integer` | sim | `0` |  |  |
| 11 | `total_delivered` | `integer` | sim | `0` |  |  |
| 12 | `total_failed` | `integer` | sim | `0` |  |  |
| 13 | `total_opt_outs` | `integer` | sim | `0` |  |  |
| 14 | `cost` | `numeric(10,4)` | sim |  |  |  |
| 15 | `provider` | `text` | sim |  |  |  |
| 16 | `segment_filter` | `jsonb` | sim | `'{}'::jsonb` |  |  |
| 17 | `metadata` | `jsonb` | sim | `'{}'::jsonb` |  |  |
| 18 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 19 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |
| 20 | `total_replies` | `integer` | não | `0` |  |  |
| 21 | `cost_estimate_cents` | `integer` | não | `0` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| sms_campaigns_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| sms_campaigns_status_check | CHECK | `CHECK (status = ANY (ARRAY['draft'::text, 'scheduled'::text, 'sending'::text, 'sent'::text, 'paused'::text, 'cancelled'::text, 'failed'::text]))` |  |  | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.sms_campaign_recipients | sms_campaign_recipients_campaign_id_fkey | campaign_id | CASCADE |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_sms_campaigns_user_id | btree | user_id | não | sim |  | `CREATE INDEX idx_sms_campaigns_user_id ON public.sms_campaigns USING btree (user_id)` |
| idx_sms_campaigns_user_status | btree | user_id, status, created_at | não | sim |  | `CREATE INDEX idx_sms_campaigns_user_status ON public.sms_campaigns USING btree (user_id, status, created_at DESC)` |
| sms_campaigns_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX sms_campaigns_pkey ON public.sms_campaigns USING btree (id)` |


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

### `Users manage own SMS campaigns`

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
| trg_sms_campaigns_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |
| update_sms_campaigns_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
