# public.offer_suggestions

> SINGU: Ofertas personalizadas sugeridas pela IA com base no perfil comportamental.

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
| usada por views | public.vw_singu_readiness |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `user_id` | `uuid` | não |  |  |  |
| 3 | `contact_id` | `uuid` | não |  |  |  |
| 4 | `offer_name` | `text` | não |  |  |  |
| 5 | `reason` | `text` | sim |  |  |  |
| 6 | `confidence_score` | `integer` | sim |  |  |  |
| 7 | `status` | `text` | sim | `'pending'::text` |  |  |
| 8 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 9 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |
| 10 | `offer_category` | `text` | sim |  |  |  |
| 11 | `presented_at` | `timestamp with time zone` | sim |  |  |  |
| 12 | `result` | `text` | sim |  |  |  |
| 13 | `expires_at` | `timestamp with time zone` | sim |  |  |  |
| 14 | `metadata` | `jsonb` | sim |  |  | Evidencia do match que sustentou a oferta: {sources: string[], keywords: string[], social_insight_ids: uuid[]}. Preenchida por generate-offer-suggestions. |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| chk_offer_status | CHECK | `CHECK (status IS NULL OR (status = ANY (ARRAY['pending'::text, 'presented'::text, 'accepted'::text, 'rejected'::text])))` |  |  | sim |
| offer_suggestions_contact_id_fkey | FOREIGN KEY | `FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| offer_suggestions_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_offer_suggestions_contact | btree | contact_id | não | sim |  | `CREATE INDEX idx_offer_suggestions_contact ON public.offer_suggestions USING btree (contact_id)` |
| idx_offer_suggestions_status | btree | status | não | sim |  | `CREATE INDEX idx_offer_suggestions_status ON public.offer_suggestions USING btree (status)` |
| idx_offer_suggestions_user_id | btree | user_id | não | sim |  | `CREATE INDEX idx_offer_suggestions_user_id ON public.offer_suggestions USING btree (user_id)` |
| offer_suggestions_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX offer_suggestions_pkey ON public.offer_suggestions USING btree (id)` |


## Policies (RLS)

### `Users can delete own`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `Users can delete their own offer suggestions`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(auth.uid() = user_id)` |
| WITH CHECK |  |

### `Users can insert own`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |

### `Users can insert their own offer suggestions`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(auth.uid() = user_id)` |

### `Users can update own`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `Users can update their own offer suggestions`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(auth.uid() = user_id)` |
| WITH CHECK |  |

### `Users can view own`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `Users can view their own offer suggestions`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(auth.uid() = user_id)` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| set_updated_at | BEFORE | UPDATE | ROW | enabled | public.set_updated_at |
| trg_set_updated_at | BEFORE | UPDATE | ROW | enabled | public.set_updated_at |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
