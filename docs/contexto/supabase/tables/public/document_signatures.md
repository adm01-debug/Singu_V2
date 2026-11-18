# public.document_signatures

> SINGU: Assinaturas eletrônicas de documentos com multi-signer, ordering, tracking completo (IP, device, location) e métodos variados.

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
| usada por views | public.document_signatures_public |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `document_id` | `uuid` | não |  |  |  |
| 3 | `user_id` | `uuid` | não |  |  |  |
| 4 | `signer_name` | `text` | não |  |  |  |
| 5 | `signer_email` | `text` | não |  |  |  |
| 6 | `signer_phone` | `text` | sim |  |  |  |
| 7 | `signer_role` | `text` | sim |  |  |  |
| 8 | `order_index` | `integer` | sim | `0` |  |  |
| 9 | `status` | `text` | não | `'pending'::text` |  |  |
| 10 | `signature_method` | `text` | sim |  |  |  |
| 11 | `signature_data` | `text` | sim |  |  |  |
| 12 | `ip_address` | `inet` | sim |  |  |  |
| 13 | `user_agent` | `text` | sim |  |  |  |
| 14 | `location` | `jsonb` | sim |  |  |  |
| 15 | `sent_at` | `timestamp with time zone` | sim |  |  |  |
| 16 | `viewed_at` | `timestamp with time zone` | sim |  |  |  |
| 17 | `signed_at` | `timestamp with time zone` | sim |  |  |  |
| 18 | `rejected_at` | `timestamp with time zone` | sim |  |  |  |
| 19 | `rejection_reason` | `text` | sim |  |  |  |
| 20 | `expires_at` | `timestamp with time zone` | sim |  |  |  |
| 21 | `verification_code` | `text` | sim |  |  |  |
| 22 | `metadata` | `jsonb` | sim | `'{}'::jsonb` |  |  |
| 23 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 24 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |
| 25 | `template_id` | `uuid` | sim |  |  |  |
| 26 | `contact_id` | `uuid` | sim |  |  |  |
| 27 | `company_id` | `uuid` | sim |  |  |  |
| 28 | `rendered_html` | `text` | sim |  |  |  |
| 29 | `merge_data` | `jsonb` | não | `'{}'::jsonb` |  |  |
| 30 | `signature_token` | `text` | não | `encode(gen_random_bytes(24), 'hex'::text)` |  |  |
| 31 | `signature_image` | `text` | sim |  |  |  |
| 32 | `signature_typed` | `text` | sim |  |  |  |
| 33 | `signed_ip` | `text` | sim |  |  |  |
| 34 | `signed_user_agent` | `text` | sim |  |  |  |
| 35 | `declined_at` | `timestamp with time zone` | sim |  |  |  |
| 36 | `declined_reason` | `text` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| document_signatures_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| document_signatures_signature_method_check | CHECK | `CHECK (signature_method = ANY (ARRAY['click'::text, 'draw'::text, 'type'::text, 'certificate'::text, 'whatsapp'::text, 'sms'::text]))` |  |  | sim |
| document_signatures_status_check | CHECK | `CHECK (status = ANY (ARRAY['pending'::text, 'sent'::text, 'viewed'::text, 'signed'::text, 'rejected'::text, 'expired'::text, 'cancelled'::text]))` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| document_signatures_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX document_signatures_pkey ON public.document_signatures USING btree (id)` |
| document_signatures_signature_token_key | btree | signature_token | sim | sim |  | `CREATE UNIQUE INDEX document_signatures_signature_token_key ON public.document_signatures USING btree (signature_token)` |
| idx_document_signatures_status | btree | user_id, status | não | sim |  | `CREATE INDEX idx_document_signatures_status ON public.document_signatures USING btree (user_id, status)` |
| idx_document_signatures_token | btree | signature_token | não | sim |  | `CREATE INDEX idx_document_signatures_token ON public.document_signatures USING btree (signature_token)` |
| idx_document_signatures_user | btree | user_id | não | sim |  | `CREATE INDEX idx_document_signatures_user ON public.document_signatures USING btree (user_id)` |


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

### `Users delete own signatures`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | public |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `Users insert own signatures`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | public |
| USING |  |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |

### `Users update own signatures`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | public |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `Users view own signatures`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | public |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| trg_document_signatures_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |
| update_document_signatures_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
